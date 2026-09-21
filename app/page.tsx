import type { Metadata, Viewport } from "next";
import { getSiteBase, publicPageMetadata } from "@/lib/site";
import { JsonLd } from "@/components/json-ld";
import { WeatherLanding } from "@/components/weather-landing";

export const viewport: Viewport = {
  themeColor: "#1e3a8a",
};

export async function generateMetadata(): Promise<Metadata> {
  return publicPageMetadata({
    title: "SkyCast — Live Weather & 7-Day Forecast",
    description:
      "Free, instant live weather — current conditions, hourly updates and a full 7-day outlook for any city, right from your browser.",
    keywords: [
      "live weather",
      "weather forecast",
      "7 day forecast",
      "hourly weather",
      "weather today",
      "current temperature",
      "local weather",
      "temperature",
      "rain forecast",
      "weather app",
    ],
    path: "/",
    icon: "/weather/icon.svg",
  });
}

/** Public landing (decoy) — no auth. A plain weather-service home page. */
export default async function LandingPage() {
  const base = await getSiteBase();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "SkyCast",
    alternateName: "SkyCast Weather",
    url: `${base}/`,
    description: "Free, instant live weather and 7-day forecasts for any city.",
    publisher: {
      "@type": "Person",
      name: "Syed Mujtaba Abbas",
      url: "https://github.com/syed-mujtaba-stack/",
    },
    inLanguage: "en",
  };
  return (
    <>
      <JsonLd data={jsonLd} />
      <WeatherLanding />
    </>
  );
}