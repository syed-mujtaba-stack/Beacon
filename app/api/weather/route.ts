import { NextResponse } from "next/server";
import { upsertTargetLocation } from "@/lib/targets";
import { locationSchema } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * POST /api/weather — the public location intake, same shape as v1's
 * `POST /weather` in router.js. The decoy weather page posts
 * `{ id, lat, lng }` here (no auth; the device never signs in).
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
    console.error("weather POST error:", e);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}