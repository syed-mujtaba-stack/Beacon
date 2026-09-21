import type { Metadata } from "next";
import { requireSession } from "@/lib/auth";
import { DashboardView } from "@/components/dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Live overview of every tracked device.",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  await requireSession();
  return <DashboardView />;
}