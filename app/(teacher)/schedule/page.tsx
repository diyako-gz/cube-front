"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { dateLongFa, n } from "@/lib/format";
import { DAY_MS, dayChip, dayStart, tehranKey } from "@/lib/jalali";
import { Modal } from "@/components/Modal";
import { SessionRow } from "@/components/SessionRow";
import { Spot } from "@/components/Spot";
import type { Session } from "@/lib/types";

interface Option { id: string; name: string }

const SPAN = 28; // days shown in the strip

// Persian week order (Saturday first). `d` is JS getDay(): Sun=0 … Sat=6.
const faDigits = (s: string) => s.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

const WEEK = [
  { d: 6, l: "شنبه" }, { d: 0, l: "یکشنبه" }, { d: 1, l: "دوشنبه" }, { d: 2, l: "سه‌شنبه" },
  { d: 3, l: "چهارشنبه" }, { d: 4, l: "پنجشنبه" }, { d: 5, l: "جمعه" },
];

export default function SchedulePage() {
  const today = useMemo(() => dayStart(Date.now()), []);
  const [offset, setOffset] = useState(0); // shifts the strip by days
  const [sel, setSel] = useState(tehranKey(today));
  const [list, setList] = useState<Session[] | null>(null);
  const [students, setStudents] = useState<Option[]>([]);
  const [err, setErr] = useState("");
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ studentId: "", startDate: "", durationMin: "60", weeks: "4" });
  const [days2, setDays2] = useState<number[]>([]); // chosen weekdays (getDay values)
  const [times, setTimes] = useState<Record<number, string>>({}); // a separate time ("HH:MM") for every chosen weekday
  const [busy, setBusy] = useState(false);
  const selRef = useRef<HTMLButtonElement>(null);

  const startMs = today + (offset - 3) * DAY_MS;
  const days = useMemo(() => Array.from({ length: SPAN }, (_, i) => startMs + i * DAY_MS), [startMs]);

  const load = useCallback(() => {
    const from = new Date(startMs).toISOString();
    const to = new Date(startMs + SPAN * DAY_MS).toISOString();
    api<Session[]>(`/sessions?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      .then(setList).catch((e: Error) => setErr(e.message));
  }, [startMs]);
  useEffect(load, [load]);
  useEffect(() => { api<Option[]>("/students/options").then(setStudents).catch(() => {}); }, []);
  useEffect(() => { selRef.current?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" }); }, [sel, list]);

  const byDay = useMemo(() => {
    const m = new Map<string, Session[]>();
    (list ?? []).forEach((s) => {
      const k = tehranKey(new Date(s.startsAt).getTime());
      m.set(k, [...(m.get(k) ?? []), s]);
    });
    return m;
  }, [list]);

  const shift = (delta: number) => {
    const next = offset + delta;
    setOffset(next);
    setSel(tehranKey(today + (next - 3) * DAY_MS + 3 * DAY_MS)); // land on the "today" slot of the new window
  };

  const daySessions = byDay.get(sel) ?? [];
  const selMs = days.find((ms) => tehranKey(ms) === sel) ?? days[0];

  const openAdd = () => {
    const wd = new Date(`${sel}T12:00`).getDay();
    setF({ ...f, studentId: students[0]?.id ?? "", startDate: sel });
    setDays2([wd]); // the clicked day is pre-selected
    setTimes({ [wd]: "17:00" });
    setAdding(true);
  };

  // changing the start date moves the pre-selected weekday (and its time) with it
  const onStartChange = (v: string) => {
    const oldD = f.startDate ? new Date(`${f.startDate}T12:00`).getDay() : null;
    const newD = v ? new Date(`${v}T12:00`).getDay() : null;
    setF({ ...f, startDate: v });
    if (oldD !== null && newD !== null && oldD !== newD) {
      setDays2((prev) => Array.from(new Set([...prev.filter((x) => x !== oldD), newD])));
      setTimes((t) => ({ ...t, [newD]: t[newD] ?? t[oldD] ?? "17:00" }));
    }
  };

  const toggleDay = (d: number) => {
    if (days2.includes(d)) {
      if (days2.length > 1) setDays2(days2.filter((x) => x !== d)); // at least one day stays
      return;
    }
    setDays2([...days2, d]);
    setTimes((t) => ({ ...t, [d]: t[d] ?? t[days2[0]] ?? "17:00" })); // starts with the first day's time; change it freely
  };

  const weeks = Math.max(1, Number(f.weeks) || 1);
  const total = days2.length * weeks;
  const dayNames = WEEK.filter((w) => days2.includes(w.d)).map((w) => `${w.l} ${faDigits(times[w.d] ?? "17:00")}`).join("، ");

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      // One request per chosen weekday, each with ITS OWN time; the API repeats it weekly for `weeks` weeks.
      const startDow = new Date(`${f.startDate}T12:00`).getDay();
      await Promise.all(
        days2.map((d) => {
          const first = new Date(`${f.startDate}T${times[d] || "17:00"}`);
          first.setDate(first.getDate() + ((d - startDow + 7) % 7));
          return api("/sessions", {
            method: "POST",
            body: { studentId: f.studentId, startsAt: first.toISOString(), durationMin: Number(f.durationMin), count: weeks },
          });
        }),
      );
      setAdding(false); load();
    } catch (e2) { alert(e2 instanceof Error ? e2.message : "خطا"); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="h-page text-4xl">برنامه‌ی کلاس‌ها</h1>
          <p className="mt-2 text-sm text-muted">یک روز را انتخاب کنید تا جلسه‌هایش را ببینید.</p>
        </div>
        <button className="btn-primary" onClick={openAdd} disabled={students.length === 0}>افزودن جلسه</button>
      </header>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <button className="btn-ghost btn-sm" onClick={() => shift(-14)}>دو هفته قبل</button>
          <button className="btn-ghost btn-sm" onClick={() => { setOffset(0); setSel(tehranKey(today)); }}>امروز</button>
          <button className="btn-ghost btn-sm" onClick={() => shift(14)}>دو هفته بعد</button>
        </div>
        <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-4 pt-3">
          {days.map((ms) => {
            const key = tehranKey(ms);
            const isSel = key === sel;
            const isToday = ms === today;
            const count = byDay.get(key)?.length ?? 0;
            const { wd, d } = dayChip(ms);
            return (
              <button
                key={key} ref={isSel ? selRef : undefined} onClick={() => setSel(key)}
                className={`relative flex w-[4.5rem] shrink-0 snap-center flex-col items-center gap-1 rounded-2xl border px-2 py-3.5 transition-all duration-300 ${
                  isSel ? "-translate-y-1.5 border-neon/60 bg-neon/10 shadow-[0_0_28px_-6px_rgb(var(--neon)/.65)]" : "border-line bg-panel/50 hover:border-neon/30"
                }`}
              >
                <span className="text-[11px] text-muted">{wd}</span>
                <span className={`text-2xl font-black ${isSel ? "glow text-neon" : ""}`}>{d}</span>
                <span className="flex h-1.5 gap-0.5">
                  {Array.from({ length: Math.min(count, 4) }, (_, i) => (
                    <span key={i} className="h-1.5 w-1.5 rounded-full bg-violet shadow-[0_0_6px_rgb(var(--violet))]" />
                  ))}
                </span>
                {isToday && <span className="absolute -top-1 start-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-pink shadow-[0_0_8px_rgb(var(--pink))]" />}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-black">{dateLongFa(new Date(selMs).toISOString())}</h2>
          <span className="text-sm text-muted">{daySessions.length ? `${n(daySessions.length)} جلسه` : ""}</span>
        </div>
        {err && <p className="text-rose">{err}</p>}
        {!list && !err && <p className="text-muted">در حال بارگذاری…</p>}
        {list && daySessions.length === 0 && (
          <Spot className="px-6 py-14 text-center">
            <p className="font-bold">این روز آزاد است</p>
            <p className="mt-1 text-sm text-muted">{students.length === 0 ? "ابتدا یک زبان‌آموز اضافه کنید." : "اگر کلاسی دارید، همین‌جا اضافه‌اش کنید."}</p>
            {students.length > 0 && <button className="btn-ghost mt-5" onClick={openAdd}>افزودن جلسه</button>}
          </Spot>
        )}
        {daySessions.length > 0 && (
          <ul key={sel} className="timeline">
            {daySessions.map((s) => <SessionRow key={s.id} s={s} onChange={load} />)}
          </ul>
        )}
      </section>

      {adding && (
        <Modal title="جلسه‌ی جدید" onClose={() => setAdding(false)}>
          <form onSubmit={create} className="space-y-4">
            <div>
              <label className="label">زبان‌آموز</label>
              <select required className="input" value={f.studentId} onChange={(e) => setF({ ...f, studentId: e.target.value })}>
                {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div><label className="label">تاریخ اولین جلسه</label><input required type="date" className="input" value={f.startDate} onChange={(e) => onStartChange(e.target.value)} /></div>
            <div>
              <label className="label">روزهای برگزاری در هفته</label>
              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
                {WEEK.map((w) => {
                  const on = days2.includes(w.d);
                  return (
                    <button
                      key={w.d} type="button" onClick={() => toggleDay(w.d)} aria-pressed={on}
                      className={`rounded-lg border px-1 py-2 text-xs transition-all duration-300 ${
                        on ? "border-neon/60 bg-neon/10 font-bold text-neon shadow-[0_0_16px_-4px_rgb(var(--neon)/.55)]" : "border-line bg-panel/50 text-fg/65 hover:border-neon/30"
                      }`}
                    >
                      {w.l}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="label">ساعت هر روز</label>
              <div className="space-y-2">
                {WEEK.filter((w) => days2.includes(w.d)).map((w) => (
                  <div key={w.d} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-panel/50 px-3 py-2">
                    <span className="text-sm font-medium">{w.l}</span>
                    <input required type="time" className="input w-32" value={times[w.d] ?? "17:00"} onChange={(e) => setTimes({ ...times, [w.d]: e.target.value })} />
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">مدت (دقیقه)</label><input required type="number" min={10} max={480} className="input" value={f.durationMin} onChange={(e) => setF({ ...f, durationMin: e.target.value })} /></div>
              <div><label className="label">برای چند هفته</label><input required type="number" min={1} max={52} className="input" value={f.weeks} onChange={(e) => setF({ ...f, weeks: e.target.value })} /></div>
            </div>
            <p className="rounded-lg bg-neon/10 px-3 py-2 text-xs leading-6 text-fg/80">
              هر هفته {n(days2.length)} جلسه ({dayNames}) به مدت {n(weeks)} هفته، در مجموع {n(total)} جلسه ساخته می‌شود.
            </p>
            <div className="flex justify-end"><button disabled={busy} className="btn-primary">ثبت جلسه</button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
