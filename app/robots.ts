import type { MetadataRoute } from "next";

/**
 * robots.txt — everything is allowed. The operator-only pages
 * (/login, /register, /dashboard, /map) carry their own noindex meta.
 */
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${base}/sitemap.xml`,
  };
}