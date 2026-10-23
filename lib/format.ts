const TZ = "Asia/Tehran";
const nf = new Intl.NumberFormat("fa-IR");

export const n = (x: number) => nf.format(x);
export const toman = (x: number) => `${nf.format(x)} تومان`;

export const dateFa = (iso?: string | null) =>
  iso ? new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeZone: TZ }).format(new Date(iso)) : "—";

export const dateLongFa = (iso: string) =>
  new Intl.DateTimeFormat("fa-IR", { weekday: "long", day: "numeric", month: "long", timeZone: TZ }).format(new Date(iso));

export const timeFa = (iso: string) =>
  new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ }).format(new Date(iso));

export const dateTimeFa = (iso: string) => `${dateFa(iso)}، ${timeFa(iso)}`;
