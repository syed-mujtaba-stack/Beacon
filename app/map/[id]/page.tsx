import type { Metadata } from "next";
import { requireSession } from "@/lib/auth";
import MapLoader from "@/components/map-loader";

export const metadata: Metadata = {
  title: "Live Map",
  description: "Follow a tracked device in real time.",
  robots: { index: false, follow: false },
};

export default async function MapPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;
  return <MapLoader targetId={id} />;
}