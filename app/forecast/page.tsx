import type { Metadata } from "next";
import { getSiteBase, publicPageMetadata } from "@/lib/site";
import { JsonLd } from "@/components/json-ld";
import { WeatherView } from "@/components/weather-view";

export async function generateMetadata(): Promise<Metadata> {
  return publicPageMetadata({
    title: "Forecast — Live Weather & 7-Day Outlook | SkyCast",
    description:
      "Live weather conditions, hourly updates and a full 7-day outlook for your city. Free, instant and accurate.",
    keywords: [
      "weather forecast",
      "7 day forecast",
      "hourly forecast",
      "forecast today",
      "temperature forecast",
      "rain forecast",
      "live weather",
      "weather today",
    ],
    path: "/forecast",
  });
}

/** Public decoy page — no auth. The target lands here and grants location. */
export default async function ForecastPage() {
  const base = await getSiteBase();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "SkyCast Forecast",
    url: `${base}/forecast`,
    description:
      "Live weather conditions, hourly updates and a full 7-day outlook for your city.",
    inLanguage: "en",
    publisher: {
      "@type": "Person",
      name: "Syed Mujtaba Abbas",
      url: "https://github.com/syed-mujtaba-stack/",
    },
  };
  return (
    <>
      <JsonLd data={jsonLd} />
      <WeatherView />
    </>
  );
}