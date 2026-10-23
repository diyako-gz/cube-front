"use client";
import { Spot } from "@/components/Spot";
import { n } from "@/lib/format";
import { tehranKey, type MonthRange } from "@/lib/jalali";
import type { PortalOverview, SessionStatus } from "@/lib/types";

const DOT: Record<SessionStatus, string> = {
  held: "bg-lime", absent: "bg-rose", cancelled: "bg-fg/30", scheduled: "bg-violet",
};
const LEGEND: [SessionStatus, string][] = [["held", "حاضر"], ["absent", "غیبت"], ["cancelled", "لغو"], ["scheduled", "جلسه‌ی بعدی"]];
const WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

/** Jalali month grid (weeks start on Saturday) with a dot per session. */
export function MonthCalendar({
  month, sessions, onPrev, onNext,
}: { month: MonthRange; sessions: PortalOverview["calendar"]; onPrev: () => void; onNext: () => void }) {
  const byDay = new Map<string, SessionStatus[]>();
  sessions.forEach((s) => {
    const k = tehranKey(new Date(s.startsAt).getTime());
    byDay.set(k, [...(byDay.get(k) ?? []), s.status]);
  });
  const dow = new Date(month.from.getTime() + 3.5 * 3600e3).getUTCDay(); // Sun = 0
  const offset = (dow + 1) % 7; // Saturday = 0
  const today = tehranKey(Date.now());

  return (
    <Spot className="p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={onPrev} className="btn-ghost btn-sm" aria-label="ماه قبل">‹</button>
        <h3 className="font-black">{month.label}</h3>
        <button onClick={onNext} className="btn-ghost btn-sm" aria-label="ماه بعد">›</button>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {WEEKDAYS.map((w) => <span key={w} className="pb-1 text-xs text-muted">{w}</span>)}
        {Array.from({ length: offset }, (_, i) => <span key={`b${i}`} />)}
        {month.days.map((d) => {
          const list = byDay.get(d.key) ?? [];
          return (
            <div
              key={d.key} title={list.length ? `${n(list.length)} جلسه` : undefined}
              className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border text-sm transition-colors ${
                d.key === today ? "border-neon/60 bg-neon/10 font-black text-neon" : list.length ? "border-line bg-panel/60" : "border-transparent text-fg/70"
              }`}
            >
              {d.label}
              <span className="flex h-1.5 gap-0.5">
                {list.slice(0, 3).map((st, i) => <span key={i} className={`h-1.5 w-1.5 rounded-full ${DOT[st]}`} />)}
              </span>
            </div>
          );
        })}
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
        {LEGEND.map(([st, label]) => (
          <li key={st} className="flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${DOT[st]}`} />{label}</li>
        ))}
      </ul>
    </Spot>
  );
}
