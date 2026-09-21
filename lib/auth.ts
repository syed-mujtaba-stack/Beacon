import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_COOKIE_MAX_AGE,
  signSession,
  type SessionPayload,
  verifySession,
} from "@/lib/jwt";

export { SESSION_COOKIE };

/** Cookie attributes shared by login/register/logout responses. */
export function sessionCookieProps(maxAge = SESSION_COOKIE_MAX_AGE) {
  // Secure by default in production (Vercel = https). Override with
  // AUTH_COOKIE_SECURE=false when running a prod build locally over http.
  const explicit = process.env.AUTH_COOKIE_SECURE;
  const secure =
    explicit === undefined
      ? process.env.NODE_ENV === "production"
      : explicit === "true";
  return {
    name: SESSION_COOKIE,
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    maxAge,
  };
}

/** Read + verify the session cookie on the server. Returns null when signed out. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

/** Like getSession but redirects to /login when unauthenticated (for pages). */
export async function requireSession(redirectTo = "/login") {
  const session = await getSession();
  if (!session) redirect(redirectTo);
  return session;
}

/** Create a signed session cookie + set it on the outgoing response (route handlers). */
export async function applySessionCookie(
  response: NextResponse,
  user: SessionPayload,
) {
  const token = await signSession(user);
  response.cookies.set({
    ...sessionCookieProps(),
    value: token,
  });
}

/** Clear the session cookie on the outgoing response. */
export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    ...sessionCookieProps(0),
    value: "",
  });
}