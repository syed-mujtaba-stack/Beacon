import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/jwt";

/**
 * Next 16 renamed `middleware` → `proxy`.
 * Here we only handle page routing:

 *   • `/dashboard` and `/map/*` → require a valid session (else → /login)
 *   • `/login`, `/register`     → bounce authenticated users to the dashboard

 * API routes enforce auth themselves inside each handler (defense in depth).
 * Public pages (/, /weather, /forecast) are intentionally open — they are
 * the innocuous decoy entry points.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  const isProtectedPage =
    pathname === "/dashboard" || pathname.startsWith("/map");
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isProtectedPage && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/map/:path*", "/login", "/register"],
};