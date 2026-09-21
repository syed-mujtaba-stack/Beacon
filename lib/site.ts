import "server-only";
import type { Metadata } from "next";
import { headers } from "next/headers";

/**
 * Resolve the absolute origin of the current request from HTTP headers.
 * Works on Vercel (preview + production) and locally without any config,
 * so OG/canonical/sitemap URLs are always correct for the live host.
 */
async function requestBase(): Promise<string> {
  try {
    const h = await headers();
    const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(
      /[\s,]/,
    )[0];
    if (host) {
      const proto = h.get("x-forwarded-proto") ?? "http";
      return `${proto}://${host}`;
    }
  } catch {
    /* fall through to env/default */
  }
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/** Absolute origin of the current request (e.g. https://skycast-xxxx.vercel.app). */
export async function getSiteBase(): Promise<string> {
  return requestBase();
}

export type PublicPageSeo = {
  title: string;
  description: string;
  keywords: string[];
  path: string;
  icon?: string;
};

/**
 * Shared SEO metadata for the public (decoy) pages.
 * IMPORTANT: everything below is weather-branded — nothing tracker-related
 * may ever appear in titles, descriptions or keywords.
 */
export async function publicPageMetadata(
  seo: PublicPageSeo,
): Promise<Metadata> {
  const base = await requestBase();
  return {
    metadataBase: new URL(base),
    title: { absolute: seo.title },
    description: seo.description,
    keywords: seo.keywords,
    alternates: { canonical: `${base}${seo.path}` },
    openGraph: {
      siteName: "SkyCast",
      title: seo.title,
      description: seo.description,
      type: "website",
      url: `${base}${seo.path}`,
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
    },
    ...(seo.icon ? { icons: { icon: seo.icon } } : {}),
  };
}