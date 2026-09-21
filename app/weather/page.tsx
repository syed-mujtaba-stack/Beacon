import type { Metadata } from "next";
import { getSiteBase, publicPageMetadata } from "@/lib/site";
import { JsonLd } from "@/components/json-ld";
import { WeatherView } from "@/components/weather-view";

export async function generateMetadata(): Promise<Metadata> {
  return publicPageMetadata({
    title: "Current Weather — Live Conditions in Your City | SkyCast",
    description:
      "Live current weather — temperature, conditions and hourly updates for your city. Free, instant and accurate.",
    keywords: [
      "current weather",
      "live weather",
      "weather in my city",
      "temperature today",
      "humidity",
      "wind speed",
      "weather today",
      "local weather",
    ],
    path: "/weather",
  });
}

/** Public decoy page — no auth. The target lands here and grants location. */
export default async function WeatherPage() {
  const base = await getSiteBase();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "SkyCast Current Weather",
    url: `${base}/weather`,
    description:
      "Live current weather — temperature, conditions and hourly updates for your city.",
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