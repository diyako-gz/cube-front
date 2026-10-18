
const TEHRAN = 3.5 * 3600e3;
const DAY = 864e5;

const dayStart = (ms: number) => Math.floor((ms + TEHRAN) / DAY) * DAY - TEHRAN;

function jalaliDay(ms: number): number {
  const parts = new Intl.DateTimeFormat("en-u-ca-persian", { day: "numeric", timeZone: "Asia/Tehran" }).formatToParts(new Date(ms));
  return parseInt(parts.find((p) => p.type === "day")?.value ?? "1", 10);
}

const monthStart = (ms: number) => {
  const s = dayStart(ms);
  return s - (jalaliDay(s) - 1) * DAY;
};

export interface MonthRange { from: Date; to: Date; label: string; days: { key: string; label: string }[] }

export function jalaliMonth(back = 0): MonthRange {
  let start = monthStart(Date.now());
  for (let i = 0; i < back; i++) start = monthStart(start - DAY);
  const end = monthStart(start + 32 * DAY);
  const label = new Intl.DateTimeFormat("fa-IR", { month: "long", year: "numeric", timeZone: "Asia/Tehran" }).format(new Date(start + DAY / 2));
  const dayFmt = new Intl.NumberFormat("fa-IR");
  const days: { key: string; label: string }[] = [];
  for (let ms = start, i = 1; ms < end; ms += DAY, i++) {
    days.push({ key: new Date(ms + TEHRAN).toISOString().slice(0, 10), label: dayFmt.format(i) });
  }
  return { from: new Date(start), to: new Date(end), label, days };
}

export const startOfTodayTehran = () => new Date(dayStart(Date.now()));

export { dayStart };
export const DAY_MS = DAY;
export const tehranKey = (ms: number) => new Date(ms + TEHRAN).toISOString().slice(0, 10);
export function dayChip(ms: number) {
  const wd = new Intl.DateTimeFormat("fa-IR", { weekday: "short", timeZone: "Asia/Tehran" }).format(new Date(ms));
  const d = new Intl.DateTimeFormat("fa-IR", { day: "numeric", timeZone: "Asia/Tehran" }).format(new Date(ms));
  return { wd, d };
}
