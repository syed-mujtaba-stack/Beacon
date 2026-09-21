import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

/** GET /api/auth/session — current user, or { user: null } when signed out. */
export async function GET() {
  const session = await getSession();
  return NextResponse.json({ user: session });
}