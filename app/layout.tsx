import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteBackground, SiteCrt } from "@/components/site-effects";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Beacon — Live Location Tracker",
    template: "%s · Beacon",
  },
  description:
    "Beacon — a terminal-styled live GPS tracking console. Real authentication, Neon-powered backend, Vercel-ready.",
  authors: [
    { name: "Syed Mujtaba Abbas", url: "https://github.com/syed-mujtaba-stack/" },
  ],
  // Google Search Console ownership verification.
  verification: {
    google: "1fO9SPiqvxF11Mi7u2hIHqTyXyghUVqj6xjCx0svCqM",
  },
};

export const viewport: Viewport = {
  themeColor: "#020503",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {/* Terminal effects render on operator pages only (see site-effects) */}
        <SiteBackground />
        <div className="relative z-10">{children}</div>
        <SiteCrt />
      </body>
    </html>
  );
}