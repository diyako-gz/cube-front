import { n } from "@/lib/format";

/** One glowing bead per session: neon = held, hollow = still to come. */
export function Beads({ total, left, size = "sm" }: { total: number; left: number; size?: "sm" | "lg" }) {
  if (total <= 0) return <span className="text-sm text-muted">—</span>;
  const MAX = 24;
  const held = Math.max(total - left, 0);
  const shown = Math.min(total, MAX);
  const heldShown = total > MAX ? Math.round((held / total) * MAX) : held;
  const dot = size === "lg" ? "h-5 w-5" : "h-2.5 w-2.5";
  return (
    <span
      role="img"
      aria-label={`${n(held)} جلسه برگزار شده، ${n(left)} جلسه مانده`}
      className={`inline-flex flex-wrap items-center ${size === "lg" ? "gap-2.5" : "gap-1"}`}
    >
      {Array.from({ length: shown }, (_, i) => {
        const isHeld = i < heldShown;
        const isLastHeld = isHeld && i === heldShown - 1;
        return (
          <span
            key={i}
            style={{ animationDelay: `${i * 45}ms` }}
            className={`animate-pop ${dot} rounded-full ${
              isHeld
                ? `bg-neon shadow-[0_0_10px_rgb(var(--neon)/.8)] ${isLastHeld ? "animate-pulseGlow" : ""}`
                : "border border-fg/25 bg-panel/50"
            }`}
          />
        );
      })}
    </span>
  );
}
