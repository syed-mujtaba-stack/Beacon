"use client";

import { useEffect, useRef } from "react";

const GLYPHS = "アァカサタナハマヤャラワンヴ0123456789ABCDEF<>/[]{}#$%&*+=^~_";

/**
 * Full-screen Matrix-style code rain on canvas + a dark vignette.
 * Runs at low opacity so the UI stays readable — just enough menace.
 */
export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Re-capture after guards so closures see non-nullable types.
    const el = canvas;
    const context = ctx;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const fontSize = 15;
    let w = window.innerWidth;
    let h = window.innerHeight;
    let cols = 0;
    let drops: number[] = [];

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      el.width = w * dpr;
      el.height = h * dpr;
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / fontSize);
      drops = Array.from({ length: cols }, () => Math.random() * -60);
    }

    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    const draw = () => {
      // Translucent fill creates the classic fading trail.
      context.fillStyle = "rgba(2, 5, 3, 0.09)";
      context.fillRect(0, 0, w, h);
      context.font = `${fontSize}px "Geist Mono", monospace`;

      for (let i = 0; i < cols; i++) {
        const char = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        context.fillStyle = Math.random() > 0.977 ? "#ccffe0" : "#00ff41";
        context.fillText(char, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > h && Math.random() > 0.976) drops[i] = 0;
        drops[i]++;
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#020503]" aria-hidden="true">
      <canvas ref={canvasRef} className="h-full w-full opacity-20" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.75) 100%)",
        }}
      />
    </div>
  );
}