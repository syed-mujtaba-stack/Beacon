import { getDb } from "@/lib/db";
import type { LocationInput } from "@/lib/validation";

/** A target is considered "live" when it pinged within this window. */
export const ONLINE_WINDOW_MS = 15_000;
/** Silently drop targets that haven't pinged for this long. */
export const STALE_TARGET_MS = 24 * 60 * 60 * 1000;
/** Keep at most this many trail points when serving a map view. */
export const TRAIL_LIMIT = 120;
/** Prune raw location points older than this. */
export const POINT_TTL_MS = 6 * 60 * 60 * 1000;
/** Minimum interval between pings from the same device (flood guard). */
export const MIN_PING_INTERVAL_MS = 1_000;

const POINT_PRUNE_INTERVAL_MS = 10 * 60 * 1000;
let lastPointPrune = 0;

async function prunePoints(force = false) {
  const now = Date.now();
  if (!force && now - lastPointPrune < POINT_PRUNE_INTERVAL_MS) return;
  lastPointPrune = now;
  // Fire-and-forget style best effort; errors swallowed so pings stay cheap.
  try {
    await getDb().locationPoint.deleteMany({
      where: { createdAt: { lt: new Date(now - POINT_TTL_MS) } },
    });
  } catch {
    /* non-critical housekeeping */
  }
}

export type TargetSummary = {
  id: string;
  lat: number;
  lng: number;
  signals: number;
  firstSeen: Date;
  lastSeen: Date;
  online: boolean;
};

function toSummary(t: {
  id: string;
  lat: number;
  lng: number;
  signals: number;
  firstSeen: Date;
  lastSeen: Date;
}): TargetSummary {
  return {
    ...t,
    online: Date.now() - t.lastSeen.getTime() < ONLINE_WINDOW_MS,
  };
}

/**
 * Record a ping from a device. Throttles bursty writes so one device can't
 * hammer Neon, then inserts a trail point.
 */
export async function upsertTargetLocation(input: LocationInput) {
  const db = getDb();
  const now = new Date();

  // Flood guard: skip if this device pinged within the last second.
  const existing = await db.target.findUnique({
    where: { id: input.id },
    select: { lastSeen: true },
  });
  if (existing && now.getTime() - existing.lastSeen.getTime() < MIN_PING_INTERVAL_MS) {
    return { throttled: true as const, target: null };
  }

  const target = await db.target.upsert({
    where: { id: input.id },
    create: {
      id: input.id,
      lat: input.lat,
      lng: input.lng,
      firstSeen: now,
      lastSeen: now,
      signals: 1,
    },
    update: {
      lat: input.lat,
      lng: input.lng,
      lastSeen: now,
      signals: { increment: 1 },
    },
  });

  try {
    await db.locationPoint.create({
      data: { targetId: input.id, lat: input.lat, lng: input.lng, createdAt: now },
    });
  } catch {
    // Trail is a nice-to-have; never fail a ping because of it.
  }

  await prunePoints();
  return { throttled: false as const, target };
}

/** All targets for the dashboard, newest first. */
export async function listTargets(): Promise<TargetSummary[]> {
  const db = getDb();
  const staleBefore = new Date(Date.now() - STALE_TARGET_MS);

  // Opportunistic cleanup: drop devices that went quiet > 24h ago.
  try {
    await db.target.deleteMany({ where: { lastSeen: { lt: staleBefore } } });
  } catch {
    /* ignore */
  }

  const rows = await db.target.findMany({
    orderBy: { lastSeen: "desc" },
  });
  return rows.map(toSummary);
}

/** Single target plus a short movement trail for the map view. */
export async function getTargetWithTrail(id: string) {
  const db = getDb();
  const target = await db.target.findUnique({ where: { id } });
  if (!target) return null;

  const points = await db.locationPoint.findMany({
    where: { targetId: id },
    orderBy: { createdAt: "asc" },
    take: TRAIL_LIMIT,
    select: { lat: true, lng: true, createdAt: true },
  });

  return {
    target: toSummary(target),
    trail: points.map((p) => ({
      lat: p.lat,
      lng: p.lng,
      at: p.createdAt.getTime(),
    })),
  };
}