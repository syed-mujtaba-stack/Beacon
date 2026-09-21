import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { applySessionCookie } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";

export const runtime = "nodejs";

const BCRYPT_COST = 12;

/** POST /api/auth/register — create an account, then sign you in. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid input",
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  const { username, password } = parsed.data;

  try {
    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
    const user = await db.user.create({
      data: { username, passwordHash },
      select: { id: true, username: true, createdAt: true },
    });

    const res = NextResponse.json(
      { user: { id: user.id, username: user.username } },
      { status: 201 },
    );
    await applySessionCookie(res, { id: user.id, username: user.username });
    return res;
  } catch (e) {
    // Unique constraint violation → username already taken.
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 },
      );
    }
    console.error("register error:", e);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}