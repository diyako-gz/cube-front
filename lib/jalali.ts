// // Jalali (Persian) month boundaries in Tehran time, using the browser's Intl calendar.
// const TEHRAN = 3.5 * 3600e3; // Iran no longer uses DST
// const DAY = 864e5;

// const dayStart = (ms: number) => Math.floor((ms + TEHRAN) / DAY) * DAY - TEHRAN;

// function jalaliDay(ms: number): number {
//   const parts = new Intl.DateTimeFormat("en-u-ca-persian", { day: "numeric", timeZone: "Asia/Tehran" }).formatToParts(new Date(ms));
//   return parseInt(parts.find((p) => p.type === "day")?.value ?? "1", 10);
// }

// const monthStart = (ms: number) => {
//   const s = dayStart(ms);
//   return s - (jalaliDay(s) - 1) * DAY;
// };

// export interface MonthRange { from: Date; to: Date; label: string; days: { key: string; label: string }[] }

// /** back = 0 → current Jalali month, 1 → previous month, … */
// export function jalaliMonth(back = 0): MonthRange {
//   let start = monthStart(Date.now());
//   for (let i = 0; i < back; i++) start = monthStart(start - DAY);
//   for (let i = 0; i < -back; i++) start = monthStart(start + 32 * DAY); // back < 0 → future months
//   const end = monthStart(start + 32 * DAY);
//   const label = new Intl.DateTimeFormat("fa-IR", { month: "long", year: "numeric", timeZone: "Asia/Tehran" }).format(new Date(start + DAY / 2));
//   const dayFmt = new Intl.NumberFormat("fa-IR");
//   const days: { key: string; label: string }[] = [];
//   for (let ms = start, i = 1; ms < end; ms += DAY, i++) {
//     days.push({ key: new Date(ms + TEHRAN).toISOString().slice(0, 10), label: dayFmt.format(i) });
//   }
//   return { from: new Date(start), to: new Date(end), label, days };
// }

// export const startOfTodayTehran = () => new Date(dayStart(Date.now()));

// export { dayStart };
// export const DAY_MS = DAY;
// export const tehranKey = (ms: number) => new Date(ms + TEHRAN).toISOString().slice(0, 10);
// export function dayChip(ms: number) {
//   const wd = new Intl.DateTimeFormat("fa-IR", { weekday: "short", timeZone: "Asia/Tehran" }).format(new Date(ms));
//   const d = new Intl.DateTimeFormat("fa-IR", { day: "numeric", timeZone: "Asia/Tehran" }).format(new Date(ms));
//   return { wd, d };
// }


// Persian (Jalali) date utilities using Tehran time.
const TEHRAN = 3.5 * 3600e3;
const DAY = 864e5;

const PERSIAN_LOCALE = "fa-IR";
const TEHRAN_TIME_ZONE = "Asia/Tehran";

const dayStart = (ms: number) =>
  Math.floor((ms + TEHRAN) / DAY) * DAY - TEHRAN;

function jalaliDay(ms: number): number {
  const parts = new Intl.DateTimeFormat("en-u-ca-persian", {
    day: "numeric",
    timeZone: TEHRAN_TIME_ZONE,
  }).formatToParts(new Date(ms));

  return parseInt(
    parts.find((part) => part.type === "day")?.value ?? "1",
    10
  );
}

const monthStart = (ms: number) => {
  const start = dayStart(ms);
  return start - (jalaliDay(start) - 1) * DAY;
};

export interface MonthRange {
  from: Date;
  to: Date;
  label: string;
  days: { key: string; label: string }[];
}

/**
 * back = 0 → ماه شمسی جاری
 * back = 1 → ماه قبل
 * back = -1 → ماه بعد
 */
export function jalaliMonth(back = 0): MonthRange {
  let start = monthStart(Date.now());

  for (let i = 0; i < back; i++) {
    start = monthStart(start - DAY);
  }

  for (let i = 0; i < -back; i++) {
    start = monthStart(start + 32 * DAY);
  }

  const end = monthStart(start + 32 * DAY);

  const label = new Intl.DateTimeFormat(PERSIAN_LOCALE, {
    calendar: "persian",
    month: "long",
    year: "numeric",
    timeZone: TEHRAN_TIME_ZONE,
  }).format(new Date(start + DAY / 2));

  const dayFormatter = new Intl.NumberFormat(PERSIAN_LOCALE);

  const days: { key: string; label: string }[] = [];

  for (let ms = start, i = 1; ms < end; ms += DAY, i++) {
    days.push({
      // برای سازگاری با دیتابیس و مقایسه تاریخ‌ها، کلید میلادی می‌ماند.
      key: tehranKey(ms),
      // عدد روز به فارسی نمایش داده می‌شود.
      label: dayFormatter.format(i),
    });
  }

  return {
    from: new Date(start),
    to: new Date(end),
    label,
    days,
  };
}

/** شروع امروز در منطقه زمانی تهران */
export const startOfTodayTehran = () => new Date(dayStart(Date.now()));

export { dayStart };
export const DAY_MS = DAY;

/**
 * کلید روز برای ذخیره‌سازی و مقایسه.
 * این مقدار عمداً میلادی باقی می‌ماند تا منطق فعلی برنامه خراب نشود.
 */
export const tehranKey = (ms: number) =>
  new Date(ms + TEHRAN).toISOString().slice(0, 10);

/** تبدیل تاریخ به رشته شمسی، مثلاً ۲ آبان ۱۴۰۵ */
export function jalaliDate(
  value: Date | string | number,
  options: Intl.DateTimeFormatOptions = {}
): string {
  return new Intl.DateTimeFormat(PERSIAN_LOCALE, {
    calendar: "persian",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: TEHRAN_TIME_ZONE,
    ...options,
  }).format(new Date(value));
}

/** تبدیل تاریخ و ساعت به رشته شمسی */
export function jalaliDateTime(
  value: Date | string | number
): string {
  return new Intl.DateTimeFormat(PERSIAN_LOCALE, {
    calendar: "persian",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TEHRAN_TIME_ZONE,
  }).format(new Date(value));
}

/** اطلاعات روز برای چیپ تقویم */
export function dayChip(ms: number) {
  const date = new Date(ms);

  const wd = new Intl.DateTimeFormat(PERSIAN_LOCALE, {
    weekday: "short",
    timeZone: TEHRAN_TIME_ZONE,
  }).format(date);

  const d = new Intl.DateTimeFormat(PERSIAN_LOCALE, {
    calendar: "persian",
    day: "numeric",
    timeZone: TEHRAN_TIME_ZONE,
  }).format(date);

  return { wd, d };
}