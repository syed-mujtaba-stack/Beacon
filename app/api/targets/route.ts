import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listTargets } from "@/lib/targets";

export const runtime = "nodejs";

/** GET /api/targets — dashboard feed of every tracked device (auth required). */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const targets = await listTargets();
    const live = targets.filter((t) => t.online).length;
    const signals = targets.reduce((sum, t) => sum + t.signals, 0);

    return NextResponse.json({ targets, stats: { total: targets.length, live, signals } });
  } catch (e) {
    console.error("listTargets error:", e);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}