"use client";

import { useEffect, useRef, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";

/**
 * Public decoy landing page — looks like an ordinary weather-service home.
 * Anything Beacon-branded, terminal-flavoured or tracking-related must never
 * appear here. All CTAs lead to /forecast (the real location intake).
 */

const WEEK = [
  { day: "Mon", icon: "⛅", high: "28°", low: "19°", bar: "70%" },
  { day: "Tue", icon: "🌤️", high: "30°", low: "21°", bar: "85%" },
  { day: "Wed", icon: "🌧️", high: "24°", low: "18°", bar: "45%" },
  { day: "Thu", icon: "⛅", high: "26°", low: "19°", bar: "65%" },
  { day: "Fri", icon: "☀️", high: "32°", low: "23°", bar: "95%" },
  { day: "Sat", icon: "🌤️", high: "31°", low: "22°", bar: "88%" },
  { day: "Sun", icon: "⛅", high: "29°", low: "20°", bar: "72%" },
];

const TILES = [
  {
    title: "Current conditions",
    value: "24° · Partly sunny",
    sub: "Feels like 26° · Humidity 48%",
    icon: "☀️",
  },
  {
    title: "Hourly forecast",
    value: "Next 24 hours",
    sub: "Updates every few minutes, automatically",
    icon: "🕐",
  },
  {
    title: "Air quality",
    value: "Good",
    sub: "AQI 34 · PM2.5 12 µg/m³",
    icon: "🌿",
  },
];

export function WeatherLanding() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);

  // Entrance animation.
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".wl-nav", { y: -20, opacity: 0, duration: 0.5 })
        .from(".wl-hero > *", { y: 22, opacity: 0, stagger: 0.07, duration: 0.5 }, "-=0.2")
        .from(".wl-tiles > *", { y: 18, opacity: 0, stagger: 0.07, duration: 0.45 }, "-=0.15")
        .from(".wl-week > *", { y: 16, opacity: 0, stagger: 0.04, duration: 0.4 }, "-=0.15")
        .from(".wl-footer", { opacity: 0, duration: 0.4 }, "-=0.1");
    }, rootRef);
    return () => ctx.revert();
  }, []);

  // Ambient motion: revolving sun rays + drifting clouds.
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(".wl-sun-rays", {
        rotate: 360,
        duration: 90,
        repeat: -1,
        ease: "none",
        transformOrigin: "center center",
      });
      gsap.to(".wl-cloud", {
        x: gsap.utils.random(-26, 26),
        duration: gsap.utils.random(11, 16),
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.35,
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  function onSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    router.push("/forecast");
  }

  return (
    <div ref={rootRef} className="relative min-h-dvh overflow-hidden">
      {/* sky gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg,#0f1e4d 0%,#1e3a8a 30%,#2563eb 58%,#38bdf8 100%)",
        }}
      />

      {/* sun with rotating rays */}
      <div className="absolute right-8 top-8 sm:right-16 sm:top-12">
        <div className="wl-sun-rays h-28 w-28">
          <div
            className="h-full w-full rounded-full"
            style={{
              background:
                "repeating-conic-gradient(from 0deg, rgba(253,224,71,0.35) 0deg 12deg, transparent 12deg 30deg)",
            }}
          />
        </div>
        <div
          className="absolute inset-0 m-auto h-[4.5rem] w-[4.5rem] rounded-full"
          style={{
            background: "radial-gradient(circle, #fef3c7, #fbbf24 60%, transparent 72%)",
            filter: "drop-shadow(0 0 28px rgba(253,224,71,0.65))",
          }}
        />
      </div>

      {/* drifting clouds */}
      <div className="wl-cloud absolute left-[5%] top-[18%] h-6 w-32 rounded-full bg-white/80 blur-[1px]">
        <div className="absolute -top-4 left-4 h-8 w-8 rounded-full bg-white/80" />
        <div className="absolute -top-2 left-12 h-6 w-6 rounded-full bg-white/80" />
      </div>
      <div
        className="wl-cloud absolute bottom-[20%] right-[7%] h-5 w-24 rounded-full bg-white/55"
        style={{ opacity: 0.7 }}
      >
        <div className="absolute -top-3 left-3 h-6 w-6 rounded-full bg-white/55" />
      </div>

      {/* ── content ── */}
      <div className="relative z-10 flex min-h-dvh flex-col">
        {/* navbar */}
        <header className="wl-nav flex items-center justify-between px-5 py-4 sm:px-10">
          <Link href="/" className="flex items-center gap-2 text-white">
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="4" fill="#fbbf24" stroke="#fbbf24" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              <path d="M7 14h.01M9.5 16h.01M15.5 15h.01M17 17h.01M7 19h.01" stroke="rgba(255,255,255,0.7)" />
            </svg>
            <span className="text-lg font-extrabold tracking-tight">
              SkyCast
            </span>
          </Link>
          <nav className="flex items-center gap-5 text-sm font-semibold text-white/90">
            <Link href="/" className="border-b-2 border-white pb-0.5">
              Home
            </Link>
            <Link
              href="/forecast"
              className="pb-0.5 opacity-80 transition hover:opacity-100"
            >
              Forecast
            </Link>
          </nav>
        </header>

        {/* hero */}
        <main className="mx-auto w-full max-w-4xl flex-1 px-5 pb-10">
          <section className="wl-hero pt-10 text-center sm:pt-16">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold tracking-wide text-white backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              LIVE WEATHER · FREE · NO SIGN-UP
            </span>
            <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl">
              Live Weather &amp; 7-Day Forecast
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-white/85 sm:text-lg">
              Current conditions, hourly updates and a full week ahead — for
              any city in the world. Instant and accurate, right from your
              browser.
            </p>

            <form
              onSubmit={onSearch}
              className="mx-auto mt-8 flex max-w-lg items-center gap-2 rounded-full bg-white p-1.5 shadow-[0_16px_40px_rgba(2,6,23,0.35)]"
            >
              <svg
                className="ml-3 shrink-0 text-slate-400"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                name="city"
                type="text"
                placeholder="Search any city…"
                aria-label="Search city"
                className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="shrink-0 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow transition hover:brightness-110 active:scale-[0.98]"
              >
                Check Weather
              </button>
            </form>

            <p className="mt-4 text-sm text-white/80">
              or{" "}
              <Link
                href="/forecast"
                className="font-bold text-white underline underline-offset-4 transition hover:brightness-125"
              >
                use my location
              </Link>{" "}
              for a personal forecast
            </p>
          </section>

          {/* feature tiles */}
          <section className="wl-tiles mt-12 grid gap-4 sm:grid-cols-3">
            {TILES.map((t) => (
              <div
                key={t.title}
                className="rounded-2xl bg-white/95 p-5 shadow-[0_16px_36px_rgba(2,6,23,0.25)]"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    {t.title}
                  </p>
                  <span className="text-xl" aria-hidden="true">
                    {t.icon}
                  </span>
                </div>
                <p className="mt-3 text-lg font-extrabold tracking-tight text-slate-900">
                  {t.value}
                </p>
                <p className="mt-1 text-xs text-slate-500">{t.sub}</p>
              </div>
            ))}
          </section>

          {/* week outlook */}
          <section className="mt-8">
            <div className="wl-week flex items-center justify-between px-1">
              <h2 className="text-sm font-extrabold uppercase tracking-widest text-white/95">
                7-Day Outlook
              </h2>
              <span className="text-xs font-semibold text-white/75">
                Updated hourly
              </span>
            </div>
            <div className="wl-week mt-3 grid grid-cols-4 gap-3 sm:grid-cols-7">
              {WEEK.map((d) => (
                <div
                  key={d.day}
                  className="rounded-2xl bg-white/95 px-3 py-4 text-center shadow-[0_12px_28px_rgba(2,6,23,0.22)]"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    {d.day}
                  </p>
                  <p className="mt-2 text-2xl" aria-hidden="true">
                    {d.icon}
                  </p>
                  <p className="mt-2 text-sm font-extrabold text-slate-900">
                    {d.high}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-400">
                    {d.low}
                  </p>
                  <div className="mx-auto mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-600"
                      style={{ width: d.bar }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* footer */}
        <footer className="wl-footer border-t border-white/15 px-5 py-6 text-center text-sm text-white/80">
          <p>
            SkyCast · Live Weather &amp; Forecasts
          </p>
          <p className="mt-1.5 text-xs text-white/70">
            Created by{" "}
            <a
              href="https://github.com/syed-mujtaba-stack/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-white underline-offset-4 transition hover:underline"
            >
              Syed Mujtaba Abbas
            </a>
          </p>
          <p className="mt-1 text-xs text-white/60">© 2026 SkyCast</p>
        </footer>
      </div>
    </div>
  );
}