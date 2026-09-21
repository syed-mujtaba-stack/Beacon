import type { Metadata } from "next";
import { WeatherView } from "@/components/weather-view";

export const metadata: Metadata = {
  // `absolute` skips the global "· Beacon" title template — the tab & preview
  // must never leak the real product name to the visitor.
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

/** Public decoy page — no auth. The target lands here and grants location. */
export default function WeatherPage() {
  return <WeatherView />;
}