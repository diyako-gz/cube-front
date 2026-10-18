"use client";
import { useId, useRef, useState } from "react";

const W = 600, H = 200, PAD = 16;

function smooth(p: [number, number][]) {
  let d = `M${p[0][0]},${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] ?? p2;
    d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
  }
  return d;
}


export function AreaChart({
  values, tip, interactive = true,
}: { values: number[]; tip?: (i: number) => string; interactive?: boolean }) {
  const id = useId().replace(/:/g, "");
  const box = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const n = values.length;
  const max = Math.max(1, ...values);

  if (n < 2) {
    return (
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" aria-hidden>
          <line x1="0" y1={H - PAD} x2={W} y2={H - PAD} className="stroke-fg/25" strokeDasharray="4 6" />
        </svg>
      </div>
    );
  }

  const pts: [number, number][] = values.map((v, i) => [(1 - i / (n - 1)) * W, H - PAD - (v / max) * (H - PAD * 2)]);
  const line = smooth(pts);
  const area = `${line} L${pts[n - 1][0]},${H} L${pts[0][0]},${H} Z`;

  const onMove = (clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    const f = 1 - (clientX - r.left) / r.width;
    setHover(Math.max(0, Math.min(n - 1, Math.round(f * (n - 1)))));
  };

  return (
    <div
      ref={box}
      className="relative touch-pan-y"
      onMouseMove={interactive ? (e) => onMove(e.clientX) : undefined}
      onMouseLeave={() => setHover(null)}
      onTouchMove={interactive ? (e) => onMove(e.touches[0].clientX) : undefined}
      onTouchEnd={() => setHover(null)}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full overflow-visible" aria-hidden>
        <defs>
          <linearGradient id={`s${id}`} x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" style={{ stopColor: "rgb(var(--neon))" }} />
            <stop offset="100%" style={{ stopColor: "rgb(var(--violet))" }} />
          </linearGradient>
          <linearGradient id={`a${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: "rgb(var(--neon))" }} stopOpacity=".32" />
            <stop offset="100%" style={{ stopColor: "rgb(var(--violet))" }} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} className="stroke-fg/[0.07]" />
        ))}
        <path d={area} fill={`url(#a${id})`} className="area-in" />
        <path d={line} pathLength={1} fill="none" stroke={`url(#s${id})`} strokeWidth="3" strokeLinecap="round" className="draw"
          style={{ filter: "drop-shadow(0 0 8px rgb(var(--neon)/.7))" }} />
      </svg>

      {hover !== null && (
        <>
          <span className="pointer-events-none absolute inset-y-0 w-px bg-neon/40" style={{ left: `${(pts[hover][0] / W) * 100}%` }} />
          <span
            className="pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-neon bg-bg shadow-[0_0_14px_rgb(var(--neon))]"
            style={{ left: `${(pts[hover][0] / W) * 100}%`, top: `${(pts[hover][1] / H) * 100}%` }}
          />
          {tip && (
            <span
              className="glass pointer-events-none absolute -top-2 -translate-x-1/2 -translate-y-full whitespace-nowrap bg-panel/90 px-3 py-1.5 text-xs"
              style={{ left: `${Math.min(88, Math.max(12, (pts[hover][0] / W) * 100))}%` }}
            >
              {tip(hover)}
            </span>
          )}
        </>
      )}
    </div>
  );
}
