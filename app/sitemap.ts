import type { MetadataRoute } from "next";

/**
 * Sitemap for the public (decoy) pages only.
 * Set NEXT_PUBLIC_SITE_URL on Vercel (e.g. https://skycast-xxx.vercel.app)
 * for a clean, production host here.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const lastModified = new Date();
  return [
    {
      url: `${base}/`,
      lastModified,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${base}/forecast`,
      lastModified,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${base}/weather`,
      lastModified,
      changeFrequency: "hourly",
      priority: 0.9,
    },
  ];
}