"use client";
import { useEffect, useId, useState } from "react";


export function Ring({
  value, size = 120, stroke = 10, children,
}: { value: number; size?: number; stroke?: number; children?: React.ReactNode }) {
  const id = useId().replace(/:/g, "");
  const [v, setV] = useState(0);
  useEffect(() => {
    const t = requestAnimationFrame(() => setV(Math.max(0, Math.min(1, value))));
    return () => cancelAnimationFrame(t);
  }, [value]);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: "rgb(var(--neon))" }} />
            <stop offset="100%" style={{ stopColor: "rgb(var(--violet))" }} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" className="stroke-fg/10" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${id})`} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - v)}
          style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(.2,.7,.2,1)", filter: "drop-shadow(0 0 6px rgb(var(--neon)/.65))" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}
