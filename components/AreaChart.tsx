// "use client";
// import { useId, useRef, useState } from "react";

// const W = 600, H = 200, PAD = 16;

// function smooth(p: [number, number][]) {
//   let d = `M${p[0][0]},${p[0][1]}`;
//   for (let i = 0; i < p.length - 1; i++) {
//     const p0 = p[i - 1] ?? p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] ?? p2;
//     d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
//   }
//   return d;
// }

// /** Smooth neon area chart. First value sits on the right (RTL). Draws itself on mount. */
// export function AreaChart({
//   values, tip, interactive = true,
// }: { values: number[]; tip?: (i: number) => string; interactive?: boolean }) {
//   const id = useId().replace(/:/g, "");
//   const box = useRef<HTMLDivElement>(null);
//   const [hover, setHover] = useState<number | null>(null);
//   const n = values.length;
//   const max = Math.max(1, ...values);

//   if (n < 2) {
//     return (
//       <div className="relative">
//         <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" aria-hidden>
//           <line x1="0" y1={H - PAD} x2={W} y2={H - PAD} className="stroke-fg/25" strokeDasharray="4 6" />
//         </svg>
//       </div>
//     );
//   }

//   const pts: [number, number][] = values.map((v, i) => [(1 - i / (n - 1)) * W, H - PAD - (v / max) * (H - PAD * 2)]);
//   const line = smooth(pts);
//   const area = `${line} L${pts[n - 1][0]},${H} L${pts[0][0]},${H} Z`;

//   const onMove = (clientX: number) => {
//     const r = box.current?.getBoundingClientRect();
//     if (!r) return;
//     const f = 1 - (clientX - r.left) / r.width;
//     setHover(Math.max(0, Math.min(n - 1, Math.round(f * (n - 1)))));
//   };

//   return (
//     <div
//       ref={box}
//       className="relative touch-pan-y"
//       onMouseMove={interactive ? (e) => onMove(e.clientX) : undefined}
//       onMouseLeave={() => setHover(null)}
//       onTouchMove={interactive ? (e) => onMove(e.touches[0].clientX) : undefined}
//       onTouchEnd={() => setHover(null)}
//     >
//       <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full overflow-visible" aria-hidden>
//         <defs>
//           <linearGradient id={`s${id}`} x1="1" y1="0" x2="0" y2="0">
//             <stop offset="0%" style={{ stopColor: "rgb(var(--neon))" }} />
//             <stop offset="100%" style={{ stopColor: "rgb(var(--violet))" }} />
//           </linearGradient>
//           <linearGradient id={`a${id}`} x1="0" y1="0" x2="0" y2="1">
//             <stop offset="0%" style={{ stopColor: "rgb(var(--neon))" }} stopOpacity=".32" />
//             <stop offset="100%" style={{ stopColor: "rgb(var(--violet))" }} stopOpacity="0" />
//           </linearGradient>
//         </defs>
//         {[0.25, 0.5, 0.75].map((f) => (
//           <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} className="stroke-fg/[0.07]" />
//         ))}
//         <path d={area} fill={`url(#a${id})`} className="area-in" />
//         <path d={line} pathLength={1} fill="none" stroke={`url(#s${id})`} strokeWidth="3" strokeLinecap="round" className="draw"
//           style={{ filter: "drop-shadow(0 0 8px rgb(var(--neon)/.7))" }} />
//       </svg>

//       {hover !== null && (
//         <>
//           <span className="pointer-events-none absolute inset-y-0 w-px bg-neon/40" style={{ left: `${(pts[hover][0] / W) * 100}%` }} />
//           <span
//             className="pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-neon bg-bg shadow-[0_0_14px_rgb(var(--neon))]"
//             style={{ left: `${(pts[hover][0] / W) * 100}%`, top: `${(pts[hover][1] / H) * 100}%` }}
//           />
//           {tip && (
//             <span
//               className="glass pointer-events-none absolute -top-2 -translate-x-1/2 -translate-y-full whitespace-nowrap bg-panel/90 px-3 py-1.5 text-xs"
//               style={{ left: `${Math.min(88, Math.max(12, (pts[hover][0] / W) * 100))}%` }}
//             >
//               {tip(hover)}
//             </span>
//           )}
//         </>
//       )}
//     </div>
//   );
// }

"use client";

import { useId, useMemo, useRef, useState } from "react";

const W = 600;
const H = 220;
const PAD_X = 12;
const PAD_Y = 20;

type Point = [number, number];

function smooth(points: Point[]) {
  if (points.length === 0) return "";
  if (points.length === 1) {
    return `M${points[0][0]},${points[0][1]}`;
  }

  let d = `M${points[0][0]},${points[0][1]}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;

    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
  }

  return d;
}

export function AreaChart({
  values,
  tip,
  interactive = true,
}: {
  values: number[];
  tip?: (i: number) => string;
  interactive?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  const box = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const chart = useMemo(() => {
    const valid = values.map((v) => (Number.isFinite(v) ? v : 0));

    const n = valid.length;

    if (n === 0) {
      return {
        points: [] as Point[],
        line: "",
        area: "",
        zeroY: H - PAD_Y,
      };
    }

    const minValue = Math.min(0, ...valid);
    const maxValue = Math.max(0, ...valid);
    const range = maxValue - minValue || 1;

    const top = PAD_Y;
    const bottom = H - PAD_Y;
    const plotHeight = bottom - top;

    const y = (v: number) => bottom - ((v - minValue) / range) * plotHeight;

    const points: Point[] = valid.map((v, i) => [
      n === 1 ? W / 2 : PAD_X + (i / (n - 1)) * (W - PAD_X * 2),
      y(v),
    ]);

    const line = smooth(points);
    const zeroY = y(0);

    const area =
      points.length > 1
        ? `${line} L${points[points.length - 1][0]},${zeroY} L${points[0][0]},${zeroY} Z`
        : "";

    return { points, line, area, zeroY };
  }, [values]);

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || chart.points.length === 0) return;

    const rect = box.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;

    const x = ((e.clientX - rect.left) / rect.width) * W;

    const fraction = (x - PAD_X) / (W - PAD_X * 2);

    const index = Math.round(
      Math.max(0, Math.min(1, fraction)) * (chart.points.length - 1),
    );

    setHover(index);
  };

  const active =
    hover !== null && chart.points[hover] ? chart.points[hover] : null;

  return (
    <div
      ref={box}
      className="relative w-full touch-pan-y select-none"
      onPointerMove={onPointerMove}
      onPointerLeave={() => setHover(null)}
      onPointerDown={(e) => {
        if (interactive && e.pointerType !== "mouse") {
          onPointerMove(e);
        }
      }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full overflow-visible"
        role="img"
        aria-label="نمودار روند مقادیر"
      >
        <defs>
          <linearGradient id={`line-${id}`} x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" style={{ stopColor: "rgb(var(--neon))" }} />
            <stop offset="100%" style={{ stopColor: "rgb(var(--violet))" }} />
          </linearGradient>

          <linearGradient id={`area-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              style={{ stopColor: "rgb(var(--neon))" }}
              stopOpacity=".28"
            />
            <stop
              offset="100%"
              style={{ stopColor: "rgb(var(--violet))" }}
              stopOpacity=".02"
            />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={PAD_X}
            x2={W - PAD_X}
            y1={PAD_Y + (H - PAD_Y * 2) * f}
            y2={PAD_Y + (H - PAD_Y * 2) * f}
            className="stroke-fg/[0.08]"
            strokeDasharray="3 5"
          />
        ))}

        {values.length > 0 && (
          <>
            <line
              x1={PAD_X}
              x2={W - PAD_X}
              y1={chart.zeroY}
              y2={chart.zeroY}
              className="stroke-fg/20"
              strokeDasharray="4 5"
            />

            {chart.area && <path d={chart.area} fill={`url(#area-${id})`} />}

            {chart.line && (
              <path
                d={chart.line}
                pathLength={1}
                fill="none"
                stroke={`url(#line-${id})`}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="draw"
                style={{
                  filter: "drop-shadow(0 0 6px rgb(var(--neon)/.55))",
                }}
              />
            )}
          </>
        )}

        {active && (
          <>
            <line
              x1={active[0]}
              x2={active[0]}
              y1={PAD_Y}
              y2={H - PAD_Y}
              stroke="rgb(var(--neon))"
              strokeOpacity=".45"
              strokeDasharray="3 4"
            />

            <circle
              cx={active[0]}
              cy={active[1]}
              r="5"
              fill="rgb(var(--bg))"
              stroke="rgb(var(--neon))"
              strokeWidth="2.5"
              style={{
                filter: "drop-shadow(0 0 5px rgb(var(--neon)))",
              }}
            />
          </>
        )}
      </svg>

      {active && hover !== null && tip && (
        <div
          className="glass pointer-events-none absolute top-0 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-panel/95 px-3 py-1.5 text-xs shadow-lg"
          style={{
            left: `${(active[0] / W) * 100}%`,
            marginTop: "4px",
          }}
        >
          {tip(hover)}
        </div>
      )}
    </div>
  );
}
