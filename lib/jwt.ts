import { SignJWT, jwtVerify } from "jose";

/**
 * Pure JWT helpers (no Next.js imports) so they can be used from `proxy.ts`,
 * route handlers, and server components alike.
 *
 * AUTH_SECRET should come from the environment. A dev fallback keeps local
 * development working before you configure `.env` — never use it in production.
 */
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
export const SESSION_COOKIE = "llt_session";

function getKey(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET ?? "dev-only-secret-change-me-in-production-!23";
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  id: string;
  username: string;
};

export async function signSession(user: SessionPayload): Promise<string> {
  return new SignJWT({ username: user.username })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getKey());
}

export async function verifySession(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getKey());
    if (typeof payload.sub !== "string" || !payload.sub) return null;
    return {
      id: payload.sub,
      username: (payload.username as string) ?? "",
    };
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_MAX_AGE = SESSION_TTL_SECONDS;