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
import gsap from "gsap";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn, shortId } from "@/lib/utils";

type LocationPayload = {
  target: {
    id: string;
    lat: number;
    lng: number;
    signals: number;
    firstSeen: string;
    lastSeen: string;
    online: boolean;
  };
  trail: Array<{ lat: number; lng: number; at: number }>;
};

const POLL_MS = 4000;
const FALLBACK_CENTER: L.LatLngExpression = [20.5937, 78.9629];

const PIN_HTML = `
  <div class="llt-pin-wrap">
    <div class="llt-pin-ring"></div>
    <div class="llt-pin-cross"></div>
    <div class="llt-pin-core"></div>
  </div>
`;

function makePinIcon() {
  return L.divIcon({
    className: "llt-pin-icon",
    html: PIN_HTML,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

/**
 * View control:
 * - no data yet → show a wide "locating target" view (no animation).
 * - first fix arrives → dramatic flyTo the target at street zoom.
 * - later pings → pan along so the marker follows the movement.
 */
function Recenter({
  position,
  initial,
}: {
  position: L.LatLngExpression;
  initial: boolean;
}) {
  const map = useMap();
  const centered = useRef(false);

  useEffect(() => {
    if (initial) {
      map.setView(FALLBACK_CENTER, 5, { animate: false });
      centered.current = false;
      return;
    }
    if (!centered.current) {
      centered.current = true;
      map.flyTo(position, 16, {
        duration: 1.8,
        easeLinearity: 0.25,
        animate: true,
      });
    } else {
      // Follow the device without yanking the zoom level.
      if (map.getZoom() < 14) map.setZoom(14);
      map.panTo(position, { animate: true, duration: 0.6 });
    }
  }, [map, position, initial]);

  return null;
}

export function MapView({ targetId }: { targetId: string }) {
  const [data, setData] = useState<LocationPayload | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [coordsCopied, setCoordsCopied] = useState(false);

  const mapReady = useRef(false);
  const markerRef = useRef<L.Marker | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const positionMemo = useMemo<L.LatLngExpression | null>(() => {
    if (!data) return null;
    return [data.target.lat, data.target.lng] as L.LatLngExpression;
  }, [data]);

  const trail = useMemo<Array<[number, number]>>(
    () =>
      data
        ? data.trail.map((p) => [p.lat, p.lng] as [number, number])
        : [],
    [data],
  );

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/location?id=${encodeURIComponent(targetId)}`, {
        cache: "no-store",
      });
      if (res.status === 404) {
        setNotFound(true);
        setError(null);
        return;
      }
      if (!res.ok) throw new Error(`request failed: ${res.status}`);
      const json = (await res.json()) as LocationPayload;
      setData(json);
      setNotFound(false);
      setError(null);
      setLastUpdated(Date.now());
      setNow(Date.now());
    } catch {
      setError("Connection lost — retrying…");
    }
  }, [targetId]);

  useEffect(() => {
    const run = () => void poll();
    const initial = setTimeout(run, 0);
    const id = setInterval(run, POLL_MS);
    return () => {
      clearTimeout(initial);
      clearInterval(id);
    };
  }, [poll]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 2000);
    return () => clearInterval(id);
  }, []);

  // Header entrance + pin drop (once the marker's DOM node exists).
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(headerRef.current, {
        y: -20,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
      });
    });
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!markerRef.current) return;
    const el = markerRef.current.getElement();
    if (!el || mapReady.current) return;
    mapReady.current = true;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { y: -40, opacity: 0, scale: 0.6 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.9,
          ease: "elastic.out(1, 0.5)",
          overwrite: true,
        },
      );
    });
    return () => ctx.revert();
  }, [positionMemo]);

  // Little pop when a fresh ping arrives.
  useEffect(() => {
    if (!markerRef.current || !lastUpdated) return;
    const el = markerRef.current.getElement();
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { scale: 1.25 },
        { scale: 1, duration: 0.5, ease: "back.out(3)", overwrite: true },
      );
    });
    return () => ctx.revert();
  }, [lastUpdated]);

  const isLive =
    !!data && now - new Date(data.target.lastSeen).getTime() < 15_000;

  const center = positionMemo ?? FALLBACK_CENTER;

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#020503]">
      {/* Glass-terminal HUD header */}
      <div
        ref={headerRef}
        className="term absolute left-1/2 top-4 z-[5000] flex w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 items-center justify-between gap-3 rounded-sm px-4 py-3"
      >
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/dashboard"
            className="flex shrink-0 items-center gap-1.5 rounded-sm border border-[rgba(0,255,65,0.35)] bg-black/60 px-2.5 py-1.5 font-mono text-xs font-bold text-[#00ff41] transition hover:bg-[#00ff41] hover:text-black"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            DASHBOARD
          </Link>
          <div className="hidden h-6 w-px bg-[rgba(51,255,119,0.2)] sm:block" />
          <div className="min-w-0">
            <div className="truncate font-mono text-sm font-bold tracking-widest text-[#00ff41]">
              TRGT_{shortId(targetId)}
            </div>
            <div className="truncate font-mono text-[11px] text-[#2fbf71]">
              {data
                ? `${data.target.lat.toFixed(4)}, ${data.target.lng.toFixed(4)} · ${data.target.signals} pings`
                : "linking…"}
            </div>
          </div>
        </div>

        <span
          className={cn(
            "shrink-0 rounded-sm border px-3 py-1 font-mono text-[11px] font-bold tracking-widest",
            isLive
              ? "border-[rgba(0,255,65,0.5)] bg-[rgba(0,255,65,0.08)] text-[#00ff41]"
              : "border-red-500/50 bg-red-500/10 text-red-400",
          )}
        >
          {isLive ? "[ TRACKING ]" : "[ SIGNAL LOST ]"}
        </span>
      </div>

      {/* Map */}
      {!notFound && (
        <MapContainer
          center={center}
          zoom={13}
          minZoom={3}
          maxZoom={22}
          zoomControl={false}
          className="z-0 h-full w-full"
          preferCanvas
        >
          {/* Dark canvas tiles up to street level (native z16). */}
          <TileLayer
            attribution="&copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
            maxZoom={16}
          />
          {/* Satellite tiles kick in automatically for depth zoom (z17+);
              beyond native z19 the tiles upscale so zoom never stops. */}
          <TileLayer
            attribution="&copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            minZoom={17}
            maxNativeZoom={19}
            maxZoom={22}
          />
          {trail.length >= 2 && (
            <Polyline
              positions={trail}
              pathOptions={{
                color: "#00ff41",
                weight: 2,
                opacity: 0.8,
                dashArray: "4 6",
              }}
            />
          )}
          {positionMemo && (
            <Marker
              ref={markerRef}
              position={positionMemo}
              icon={makePinIcon()}
            />
          )}
          <Recenter position={positionMemo ?? center} initial={!data} />
        </MapContainer>
      )}

      {/* scanline overlay */}
      <div
        className="map-scan pointer-events-none absolute inset-0 z-[4000]"
        aria-hidden="true"
      />

      {/* Overlays */}
      {notFound && (
        <div className="absolute inset-0 z-[5000] flex items-center justify-center p-6">
          <div className="term w-full max-w-sm rounded-sm p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-sm border border-[rgba(0,255,65,0.4)] bg-black/60 font-mono text-xl text-[#00ff41]">
              ▓
            </div>
            <h2 className="font-mono text-lg font-bold tracking-widest text-[#00ff41]">
              [ TARGET NOT FOUND ]
            </h2>
            <p className="mt-2 font-mono text-xs leading-5 text-[#2fbf71]">
              no device has reported this id yet. open the payload link on a
              device, then come back.
            </p>
            <Link
              href="/dashboard"
              className="mt-6 inline-block rounded-sm border border-[#00ff41] bg-black/60 px-5 py-2.5 font-mono text-xs font-bold tracking-widest text-[#00ff41] transition hover:bg-[#00ff41] hover:text-black"
            >
              [ BACK TO CONSOLE ]
            </Link>
          </div>
        </div>
      )}

      {error && !notFound && (
        <div className="absolute bottom-4 left-1/2 z-[5000] -translate-x-1/2 rounded-sm border border-amber-500/40 bg-black/80 px-4 py-2 font-mono text-xs font-bold text-amber-400">
          [!] {error}
        </div>
      )}

      {/* Reach the target: exact coords + one-tap Google Maps directions */}
      {data && (
        <div className="absolute bottom-4 left-4 z-[5000] flex max-w-[calc(100%-2rem)] flex-col items-start gap-2">
          <div className="term flex min-w-0 items-center gap-3 rounded-sm px-4 py-3">
            <div className="min-w-0">
              <div className="font-mono text-[10px] tracking-widest text-[#2fbf71]">
                TARGET POSITION
              </div>
              <div className="truncate font-mono text-xs font-bold text-[#00ff41]">
                {data.target.lat.toFixed(6)}, {data.target.lng.toFixed(6)}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard
                  .writeText(
                    `${data.target.lat.toFixed(6)}, ${data.target.lng.toFixed(6)}`,
                  )
                  .then(() => setCoordsCopied(true))
                  .catch(() => undefined);
                setTimeout(() => setCoordsCopied(false), 1800);
              }}
              className="rounded-sm border border-[rgba(0,255,65,0.35)] bg-black/70 px-3 py-2 font-mono text-[11px] font-bold tracking-widest text-[#00ff41] transition hover:border-[#00ff41]"
            >
              [ {coordsCopied ? "COORDS COPIED ✓" : "COPY COORDS"} ]
            </button>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${data.target.lat},${data.target.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-sm border border-[#00ff41] bg-[rgba(0,255,65,0.12)] px-3 py-2 font-mono text-[11px] font-bold tracking-widest text-[#00ff41] transition hover:bg-[#00ff41] hover:text-black"
            >
              [ NAVIGATE ▸ ]
            </a>
          </div>
        </div>
      )}

      <style jsx global>{`
        .llt-pin-icon {
          background: transparent;
          border: none;
        }
        .llt-pin-wrap {
          position: relative;
          width: 44px;
          height: 44px;
        }
        .llt-pin-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid rgba(0, 255, 65, 0.85);
          box-shadow:
            0 0 14px rgba(0, 255, 65, 0.6),
            inset 0 0 14px rgba(0, 255, 65, 0.2);
          animation: llt-ring-pulse 1.8s infinite;
        }
        @keyframes llt-ring-pulse {
          0%,
          100% {
            box-shadow:
              0 0 14px rgba(0, 255, 65, 0.6),
              inset 0 0 14px rgba(0, 255, 65, 0.2);
          }
          50% {
            box-shadow:
              0 0 22px rgba(0, 255, 65, 0.9),
              inset 0 0 18px rgba(0, 255, 65, 0.35);
          }
        }
        .llt-pin-ring::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1px solid rgba(0, 255, 65, 0.7);
          animation: llt-ring-echo 1.8s infinite;
        }
        @keyframes llt-ring-echo {
          0% {
            transform: scale(0.6);
            opacity: 0.9;
          }
          100% {
            transform: scale(1.7);
            opacity: 0;
          }
        }
        .llt-pin-core {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 10px;
          height: 10px;
          margin: -5px 0 0 -5px;
          border-radius: 50%;
          background: #00ff41;
          box-shadow:
            0 0 12px #00ff41,
            0 0 32px rgba(0, 255, 65, 0.85);
        }
        .llt-pin-cross {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 28px;
          height: 28px;
          margin: -14px 0 0 -14px;
        }
        .llt-pin-cross::before {
          content: "";
          position: absolute;
          left: 50%;
          top: 0;
          bottom: 0;
          width: 1px;
          background: rgba(0, 255, 65, 0.9);
          transform: translateX(-50%);
        }
        .llt-pin-cross::after {
          content: "";
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: rgba(0, 255, 65, 0.9);
          transform: translateY(-50%);
        }
        .leaflet-container {
          background: #020503;
          font-family: inherit;
        }
        .leaflet-control-attribution {
          background: rgba(0, 0, 0, 0.6) !important;
          color: #1f9e4d !important;
          font-size: 10px !important;
          font-family: inherit;
        }
        .leaflet-control-attribution a {
          color: #00ff41 !important;
        }
      `}</style>
    </div>
  );
}