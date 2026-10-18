import { tehranKey } from "./jalali";
import type { IncomeReport } from "./types";

export interface DayPoint { key: string; label: string; day: number; total: number }


export function cumulativeSeries(r: IncomeReport, days: { key: string; label: string }[], untilToday: boolean): DayPoint[] {
  const todayKey = tehranKey(Date.now());
  const byDay = new Map(r.daily.map((d) => [d.day, d.amount]));
  const list = untilToday ? days.filter((d) => d.key <= todayKey) : days;
  let sum = 0;
  return list.map((d) => {
    const v = byDay.get(d.key) ?? 0;
    sum += v;
    return { key: d.key, label: d.label, day: v, total: sum };
  });
}
