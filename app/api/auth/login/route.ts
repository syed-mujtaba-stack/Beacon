import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { applySessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

export const runtime = "nodejs";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/** POST /api/auth/login — verify credentials and sign in. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { username, password } = parsed.data;

  try {
    const user = await db.user.findUnique({ where: { username } });

    // Generic error so we don't leak whether a username exists.
    if (!user) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 },
      );
    }

    // Account lockout.
    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      const mins = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60_000,
      );
      return NextResponse.json(
        { error: `Too many attempts. Try again in ${mins} minute(s).` },
        { status: 423 },
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);

    if (!valid) {
      const failedAttempts = user.failedAttempts + 1;
      const locked =
        failedAttempts >= MAX_FAILED_ATTEMPTS
          ? new Date(Date.now() + LOCK_DURATION_MS)
          : null;
      await db.user.update({
        where: { id: user.id },
        data: {
          failedAttempts: locked ? 0 : failedAttempts,
          lockedUntil: locked,
        },
      });
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 },
      );
    }

    // Success — reset the attempt counter and sign in.
    if (user.failedAttempts > 0 || user.lockedUntil) {
      await db.user.update({
        where: { id: user.id },
        data: { failedAttempts: 0, lockedUntil: null },
      });
    }

    const res = NextResponse.json(
      { user: { id: user.id, username: user.username } },
      { status: 200 },
    );
    await applySessionCookie(res, { id: user.id, username: user.username });
    return res;
  } catch (e) {
    console.error("login error:", e);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}