import type { Metadata } from "next";
import { WeatherView } from "@/components/weather-view";

export const metadata: Metadata = {
  title: { absolute: "SkyCast — Live Weather & Forecast" },
  description:
    "Check today's live weather, hourly forecast and 7-day outlook for your city. Free, instant and accurate.",
  openGraph: {
    siteName: "SkyCast",
    title: "SkyCast — Live Weather & Forecast",
    description:
      "Check today's live weather, hourly forecast and 7-day outlook for your city.",
    type: "website",
  },
};

/** Second innocuous entry path. Same decoy page, different clean URL. */
export default function ForecastPage() {
  return <WeatherView />;
}