import type { Metadata, Viewport } from "next";
import { WeatherLanding } from "@/components/weather-landing";

export const metadata: Metadata = {
  // `absolute` skips the global "· Beacon" title template — the tab & preview
  // must never leak the real product name on public pages.
  title: { absolute: "SkyCast — Live Weather & 7-Day Forecast" },
  description:
    "Free, instant live weather — current conditions, hourly updates and a 7-day outlook for any city, right from your browser.",
  openGraph: {
    siteName: "SkyCast",
    title: "SkyCast — Live Weather & 7-Day Forecast",
    description:
      "Current conditions, hourly updates and a full 7-day outlook. Free, instant, accurate.",
    type: "website",
  },
  icons: { icon: "/weather/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#1e3a8a",
};

/** Public landing (decoy) — no auth. A plain weather-service home page. */
export default function LandingPage() {
  return <WeatherLanding />;
}