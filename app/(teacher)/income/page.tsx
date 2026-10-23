"use client";
import { useEffect, useMemo, useState } from "react";
import { api, download } from "@/lib/api";
import { dateFa, n, toman } from "@/lib/format";
import { jalaliMonth } from "@/lib/jalali";
import { cumulativeSeries } from "@/lib/income";
import { AreaChart } from "@/components/AreaChart";
import { CountUp } from "@/components/CountUp";
import { Spot } from "@/components/Spot";
import type { IncomeReport } from "@/lib/types";

export default function IncomePage() {
  const [back, setBack] = useState(0);
  const [r, setR] = useState<IncomeReport | null>(null);
  const [err, setErr] = useState("");
  const month = useMemo(() => jalaliMonth(back), [back]);
  const pills = useMemo(() => Array.from({ length: 6 }, (_, i) => jalaliMonth(i).label), []);

  useEffect(() => {
    setR(null);
    api<IncomeReport>(`/reports/income?from=${encodeURIComponent(month.from.toISOString())}&to=${encodeURIComponent(month.to.toISOString())}`)
      .then(setR).catch((e: Error) => setErr(e.message));
  }, [month]);

  const exportCsv = async () => {
    try {
      await download(`/reports/income.csv?from=${encodeURIComponent(month.from.toISOString())}&to=${encodeURIComponent(month.to.toISOString())}`,
        `income-${month.label.replace(/\s+/g, "-")}.csv`);
    } catch (e) { alert(e instanceof Error ? e.message : "خطا"); }
  };

  const series = useMemo(() => (r ? cumulativeSeries(r, month.days, back === 0) : []), [r, month, back]);
  const best = r?.daily.reduce((a, b) => (b.amount > a.amount ? b : a), { day: "", amount: 0 });
  const topMax = Math.max(1, ...(r?.students.map((s) => s.amount) ?? [0]));

  return (
    <div className="space-y-8">
      <header>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="h-page text-4xl">درآمد {month.label}</h1>
          <div className="no-print flex gap-2">
            <button onClick={exportCsv} className="btn-ghost btn-sm">خروجی اکسل</button>
            <button onClick={() => window.print()} className="btn-ghost btn-sm">چاپ / PDF</button>
          </div>
        </div>
        <div className="no-print -mx-1 mt-5 flex gap-2 overflow-x-auto px-1 pb-1">
          {pills.map((label, i) => (
            <button
              key={i} onClick={() => setBack(i)}
              className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-sm transition-all duration-300 ${
                back === i ? "border-neon/60 bg-neon/10 text-neon shadow-[0_0_20px_-4px_rgb(var(--neon)/.55)]" : "border-line bg-panel/50 text-fg/65 hover:border-neon/30"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {err && <p className="text-rose">{err}</p>}
      {!r && !err && <p className="text-muted">در حال بارگذاری…</p>}

      {r && (
        <>
          <Spot className="p-8 sm:p-10">
            <p className="text-sm text-muted">مجموع درآمد {month.label}</p>
            <p className="glow mt-2 text-5xl font-black sm:text-6xl"><CountUp value={r.total} format={toman} /></p>
            <p className="mt-3 text-sm text-fg/60">{r.count === 0 ? "در این ماه پرداختی ثبت نشده است." : `از ${n(r.count)} پرداخت`}</p>
            <div className="mt-8">
              <AreaChart
                values={series.map((p) => p.total)}
                tip={(i) => `${series[i].label} ${month.label.split(" ")[0]}: ${toman(series[i].total)}${series[i].day ? `  (+${toman(series[i].day)})` : ""}`}
              />
              <p className="mt-2 text-xs text-muted">نمودار، جمع درآمد تا هر روز از ماه است. نشانگر را روی آن حرکت دهید.</p>
            </div>
          </Spot>

          <section className="grid gap-4 sm:grid-cols-3">
            <Spot className="spot-lift p-6">
              <p className="text-3xl font-black"><CountUp value={r.count} format={n} /></p>
              <p className="mt-1 text-sm text-muted">تعداد پرداخت</p>
            </Spot>
            <Spot className="spot-lift p-6">
              <p className="text-3xl font-black"><CountUp value={r.count ? Math.round(r.total / r.count) : 0} format={toman} /></p>
              <p className="mt-1 text-sm text-muted">میانگین هر پرداخت</p>
            </Spot>
            <Spot className="spot-lift p-6">
              <p className="text-3xl font-black">{best && best.amount > 0 ? toman(best.amount) : "—"}</p>
              <p className="mt-1 text-sm text-muted">{best && best.amount > 0 ? `بهترین روز، ${dateFa(`${best.day}T12:00:00+03:30`)}` : "بهترین روز"}</p>
            </Spot>
          </section>

          {r.students.length > 0 && (
            <section>
              <h2 className="h-sec mb-3">سهم هر زبان‌آموز</h2>
              <ul className="space-y-3">
                {r.students.map((s, i) => (
                  <li key={s.name}>
                    <Spot className="px-6 py-4">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-bold">{s.name}</span>
                        <span>{toman(s.amount)} <span className="text-xs text-muted">({n(s.count)} پرداخت)</span></span>
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-fg/[0.08]">
                        <div
                          className="growx h-full rounded-full bg-gradient-to-l from-neon to-violet shadow-[0_0_10px_rgb(var(--neon)/.6)]"
                          style={{ width: `${(s.amount / topMax) * 100}%`, animationDelay: `${i * 90}ms` }}
                        />
                      </div>
                    </Spot>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
