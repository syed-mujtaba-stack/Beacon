"use client";

import { usePathname } from "next/navigation";
import { AnimatedBackground } from "@/components/animated-background";

/**
 * Terminal/CRT effects should exist ONLY on operator pages.
 * The decoy pages (/, /weather, /forecast) get a clean, innocent look.
 */

const BEACON_PREFIXES = ["/login", "/register", "/dashboard", "/map"];

function isBeaconPath(pathname: string) {
  return BEACON_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/** Matrix rain — rendered behind page content on operator pages only. */
export function SiteBackground() {
  const pathname = usePathname() ?? "/";
  if (!isBeaconPath(pathname)) return null;
  return <AnimatedBackground />;
}

/** CRT scanline overlay + flicker — on top of operator pages only. */
export function SiteCrt() {
  const pathname = usePathname() ?? "/";
  if (!isBeaconPath(pathname)) return null;
  return <div className="crt-overlay" aria-hidden="true" />;
}