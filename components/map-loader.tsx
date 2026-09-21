"use client";

import dynamic from "next/dynamic";

const MapView = dynamic(
  () => import("@/components/map-view").then((m) => m.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-dvh w-full items-center justify-center bg-[#0b1120] text-slate-400">
        Loading map…
      </div>
    ),
  },
);

/** Client-side dynamic loader so Leaflet never touches the server. */
export default function MapLoader({ targetId }: { targetId: string }) {
  return <MapView targetId={targetId} />;
}