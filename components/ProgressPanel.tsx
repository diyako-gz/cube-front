"use client";
import { CountUp } from "@/components/CountUp";
import { Ring } from "@/components/Ring";
import { Spot } from "@/components/Spot";
import { n } from "@/lib/format";
import type { BadgeInfo, PortalOverview } from "@/lib/types";

const META: Record<string, { title: string; desc: string; glyph: string }> = {
  first: { title: "قدم اول", desc: "اولین جلسه‌ات را برگزار کن", glyph: "۱" },
  ten: { title: "ده جلسه", desc: "۱۰ جلسه‌ی برگزارشده", glyph: "۱۰" },
  twentyfive: { title: "بیست‌وپنج جلسه", desc: "۲۵ جلسه‌ی برگزارشده", glyph: "۲۵" },
  streak4: { title: "چهار هفته پیوسته", desc: "۴ هفته پشت‌سرهم بدون غیبت", glyph: "۴×" },
  perfect: { title: "حضور کامل", desc: "۸ جلسه بدون هیچ غیبت", glyph: "✓" },
  loyal: { title: "همراه سه‌ماهه", desc: "۹۰ روز از شروع کلاس‌ها", glyph: "۹۰" },
};

function Flame({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-10 w-10 ${on ? "text-amber" : "text-fg/25"}`} fill="currentColor" aria-hidden
      style={on ? { filter: "drop-shadow(0 0 8px rgb(var(--amber)))" } : undefined}>
      <path d="M12 2c.6 3.4-2.4 5-2.4 8.2A3.6 3.6 0 0 0 13.200 14c2 0 3.300-1.600 3.300-3.700 2 1.500 3 3.600 3 5.900a7.500 7.500 0 0 1-15 0c0-4.600 4-6.500 7.500-14.200z" />
    </svg>
  );
}

function Medal({ b }: { b: BadgeInfo }) {
  const m = META[b.id];
  return (
    <Spot className={`p-4 text-center ${b.earned ? "" : "opacity-60"}`}>
      <div className="relative mx-auto h-16 w-16">
        <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden
          style={b.earned ? { filter: "drop-shadow(0 0 10px rgb(var(--neon) / .6))" } : undefined}>
          <polygon points="32,3 58,18 58,46 32,61 6,46 6,18" strokeWidth="2.500" strokeLinejoin="round"
            className={b.earned ? "fill-neon/15 stroke-neon" : "fill-fg/5 stroke-fg/25"} />
        </svg>
        <span className={`absolute inset-0 grid place-items-center text-lg font-black ${b.earned ? "text-neon" : "text-fg/40"}`}>{m.glyph}</span>
      </div>
      <p className="mt-3 text-sm font-bold">{m.title}</p>
      <p className="mt-0.5 text-xs leading-5 text-muted">{m.desc}</p>
      {!b.earned && (
        <div className="mt-3">
          <div className="h-1 overflow-hidden rounded-full bg-fg/10">
            <div className="h-full rounded-full bg-gradient-to-l from-neon to-violet" style={{ width: `${(b.current / b.target) * 100}%` }} />
          </div>
          <p className="mt-1 text-[11px] text-muted">{n(b.current)} از {n(b.target)}</p>
        </div>
      )}
    </Spot>
  );
}

/** Attendance rate, week streak and badges. */
export function ProgressPanel({ ov }: { ov: PortalOverview }) {
  const { stats, badges } = ov;
  const counted = stats.held + stats.absent;
  return (
    <section className="space-y-4">
      <h2 className="h-sec">پیشرفت شما</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Spot className="flex items-center gap-5 p-6">
          <Ring value={stats.rate / 100} size={92} stroke={9}>
            <span className="text-lg font-black">{counted ? <CountUp value={stats.rate} format={(v) => `${n(v)}٪`} /> : "—"}</span>
          </Ring>
          <div>
            <p className="font-bold">نمره‌ی حضور</p>
            <p className="mt-1 text-xs leading-6 text-muted">
              {counted ? `${n(stats.held)} جلسه حاضر، ${n(stats.absent)} غیبت` : "بعد از اولین جلسه نمایش داده می‌شود."}
            </p>
          </div>
        </Spot>
        <Spot className="flex items-center gap-5 p-6">
          <Flame on={stats.streak > 0} />
          <div>
            <p className="text-2xl font-black"><CountUp value={stats.streak} format={(v) => `${n(v)} هفته`} /></p>
            <p className="mt-1 text-xs leading-6 text-muted">
              پشت‌سرهم بدون غیبت{stats.bestStreak > 0 && ` · رکورد شما ${n(stats.bestStreak)} هفته`}
            </p>
          </div>
        </Spot>
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {badges.map((b) => <li key={b.id}><Medal b={b} /></li>)}
      </ul>
    </section>
  );
}
