"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";

type Mode = "login" | "register";

const BOOT_LINES = [
  "beacon-shell v2.0.0  — secure link established",
  "rsa-4096 handshake . . . . . . . OK",
  "scanning for operator . . . . . . CONNECTED",
];

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const isLogin = mode === "login";
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [bootCount, setBootCount] = useState(0);

  const winRef = useRef<HTMLDivElement>(null);

  // Typewriter boot log.
  useLayoutEffect(() => {
    const id = setInterval(() => {
      setBootCount((c) => Math.min(c + 1, BOOT_LINES.length));
    }, 320);
    return () => clearInterval(id);
  }, []);

  // Entrance: window rise → boot lines. (Form + button stay visible from
  // the start so the submit control can never be stuck hidden.)
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(winRef.current, { opacity: 0, y: 26, duration: 0.5 }).from(
        ".boot-line",
        { opacity: 0, x: -10, duration: 0.22 },
        0.35,
      );
    }, winRef);
    return () => ctx.revert();
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const form = e.currentTarget;
    const data = new FormData(form);
    const body = JSON.stringify({
      username: String(data.get("username") ?? "").trim(),
      password: String(data.get("password") ?? ""),
    });

    try {
      const res = await fetch(`/api/auth/${isLogin ? "login" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!res.ok) {
        setError(json.error ?? "REQUEST FAILED");
        setPending(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("NETWORK ERROR — RETRY");
      setPending(false);
    }
  }

  const shownLines = BOOT_LINES.slice(0, bootCount);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 py-10">
      <div ref={winRef} className="term w-full max-w-md rounded-md">
        {/* ── titlebar ── */}
        <div className="term-titlebar text-xs tracking-widest text-[#2fbf71]">
          <span className="flex items-center gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
          </span>
          <span className="ml-2 truncate">root@beacon:~/secure_shell</span>
          <span className="ml-auto hidden shrink-0 text-[10px] text-[#1f9e4d] sm:inline">
            v2.0.0
          </span>
        </div>

        {/* ── body ── */}
        <div className="p-6 sm:p-8">
          <div className="min-h-[4.6rem] text-xs leading-6 text-[#3ddc84]">
            {shownLines.map((line) => (
              <p key={line} className="boot-line">
                {line}
              </p>
            ))}
            {bootCount < BOOT_LINES.length ? (
              <p className="boot-line caret" aria-hidden="true" />
            ) : (
              <p className="mt-1 text-[#1f9e4d]">
                ── {isLogin ? "ACCESS REQUIRED" : "OPERATOR SIGNUP"} ──
              </p>
            )}
          </div>

          <form
            onSubmit={onSubmit}
            className="mt-5 space-y-4 border-t border-[rgba(0,255,65,0.15)] pt-5"
          >
            <label className="field-block block">
              <span className="mb-1.5 block text-xs text-[#2fbf71]">
                operator_id:
              </span>
              <input
                name="username"
                type="text"
                required
                minLength={3}
                maxLength={24}
                autoComplete="username"
                placeholder="neo_2026"
                spellCheck={false}
                className="w-full rounded-sm border border-[#0f4d2b] bg-black/70 px-3 py-2.5 text-sm text-[#00ff41] placeholder-[#1f9e4d] caret-[#00ff41] outline-none transition focus:border-[#00ff41] focus:shadow-[0_0_12px_rgba(0,255,65,0.25)]"
              />
            </label>

            <label className="field-block block">
              <span className="mb-1.5 block text-xs text-[#2fbf71]">
                access_key:
              </span>
              <input
                name="password"
                type="password"
                required
                minLength={8}
                maxLength={128}
                autoComplete={isLogin ? "current-password" : "new-password"}
                placeholder="••••••••"
                className="w-full rounded-sm border border-[#0f4d2b] bg-black/70 px-3 py-2.5 text-sm text-[#00ff41] placeholder-[#1f9e4d] caret-[#00ff41] outline-none transition focus:border-[#00ff41] focus:shadow-[0_0_12px_rgba(0,255,65,0.25)]"
              />
            </label>

            {error && (
              <p
                role="alert"
                className="field-block rounded-sm border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs font-bold tracking-wide text-red-400"
              >
                [!] {error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="access-btn w-full rounded-sm border border-[#00ff41] bg-black/60 py-3 text-sm font-bold tracking-widest text-[#00ff41] shadow-[0_0_14px_rgba(0,255,65,0.2)] transition hover:bg-[#00ff41] hover:text-black hover:shadow-[0_0_24px_rgba(0,255,65,0.55)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending
                ? "[ PROCESSING… ]"
                : isLogin
                  ? "[ LOGIN ]"
                  : "[ REGISTER ]"}
            </button>

            <div className="text-center text-xs text-[#2fbf71]">
              {isLogin ? (
                <>
                  [ no access yet?{" "}
                  <Link
                    href="/register"
                    className="font-bold text-[#00ff41] underline-offset-4 hover:underline"
                  >
                    register
                  </Link>{" "}
                  ]
                </>
              ) : (
                <>
                  [ already registered?{" "}
                  <Link
                    href="/login"
                    className="font-bold text-[#00ff41] underline-offset-4 hover:underline"
                  >
                    login
                  </Link>{" "}
                  ]
                </>
              )}
            </div>
          </form>
        </div>
      </div>

      <p className="px-4 text-center font-mono text-[10px] tracking-widest text-[#1f9e4d]">
        DEV:{" "}
        <a
          href="https://github.com/syed-mujtaba-stack/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-[#00ff41] underline-offset-4 transition hover:underline"
        >
          SYED MUJTABA ABBAS
        </a>{" "}
        · github.com/syed-mujtaba-stack
      </p>
    </div>
  );
}