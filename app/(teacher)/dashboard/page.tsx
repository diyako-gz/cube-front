"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { dateLongFa, n, timeFa, toman } from "@/lib/format";
import { jalaliMonth } from "@/lib/jalali";
import { cumulativeSeries } from "@/lib/income";
import { useMe } from "@/components/Shell";
import { AreaChart } from "@/components/AreaChart";
import { Beads } from "@/components/Beads";
import { CountUp } from "@/components/CountUp";
import { RequestsPanel } from "@/components/RequestsPanel";
import { Ring } from "@/components/Ring";
import { SessionRow } from "@/components/SessionRow";
import { Spot } from "@/components/Spot";
import { StatusBadge } from "@/components/StatusBadge";
import type { Dashboard, IncomeReport, Student } from "@/lib/types";

export default function DashboardPage() {
  const me = useMe();
  const [d, setD] = useState<Dashboard | null>(null);
  const [inc, setInc] = useState<IncomeReport | null>(null);
  const [err, setErr] = useState("");
  const month = useMemo(() => jalaliMonth(0), []);

  const load = useCallback(() => {
    api<Dashboard>("/dashboard").then(setD).catch((e: Error) => setErr(e.message));
    api<IncomeReport>(`/reports/income?from=${encodeURIComponent(month.from.toISOString())}&to=${encodeURIComponent(month.to.toISOString())}`)
      .then(setInc).catch(() => {});
  }, [month]);
  useEffect(load, [load]);

  const pay = async (s: Student) => {
    if (!confirm(`پرداخت ${toman(s.price)} از ${s.name} ثبت شود؟`)) return;
    try { await api(`/students/${s.id}/payments`, { method: "POST", body: {} }); load(); }
    catch (e) { alert(e instanceof Error ? e.message : "خطا"); }
  };

  const series = useMemo(() => (inc ? cumulativeSeries(inc, month.days, true) : []), [inc, month]);

  if (err) return <p className="text-rose">{err}</p>;
  if (!d) return <p className="text-muted">در حال بارگذاری…</p>;

  const todayLabel = dateLongFa(new Date().toISOString());
  const todayCount = [...d.pendingSessions, ...d.upcomingSessions].filter((s) => dateLongFa(s.startsAt) === todayLabel).length;
  const paidPct = d.students ? d.paid / d.students : 0;

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Spot className="flex flex-col justify-between p-8 sm:p-10">
          <div>
            <p className="text-sm text-muted">{todayLabel}</p>
            <h1 className="h-page mt-3 text-4xl leading-tight sm:text-5xl">{me.name}، سلام</h1>
            <p className="mt-4 max-w-md leading-8 text-fg/70">
              {todayCount > 0 ? `امروز ${n(todayCount)} جلسه در برنامه‌ی شماست.` : "امروز جلسه‌ای در برنامه نیست."}
              {d.needsAttention.length > 0 && ` ${n(d.needsAttention.length)} زبان‌آموز به پیگیری نیاز دارند.`}
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/schedule" className="btn-primary">افزودن جلسه</Link>
            <Link href="/students" className="btn-ghost">زبان‌آموزان</Link>
          </div>
        </Spot>

        <Spot className="p-6">
          <p className="text-sm text-muted">درآمد {month.label}</p>
          <p className="glow mt-2 text-3xl font-black">
            {inc ? <CountUp value={inc.total} format={toman} /> : "…"}
          </p>
          <div className="mt-4">
            <AreaChart values={series.map((p) => p.total)} interactive={false} />
          </div>
        </Spot>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Spot className="spot-lift p-5">
          <p className="glow text-4xl font-black"><CountUp value={d.students} format={n} /></p>
          <p className="mt-1 text-sm text-muted">زبان‌آموز</p>
        </Spot>
        <Spot className="spot-lift flex items-center gap-4 p-5">
          <Ring value={paidPct} size={68} stroke={7}>
            <span className="text-sm font-black">{n(Math.round(paidPct * 100))}٪</span>
          </Ring>
          <div>
            <p className="text-sm font-bold">شهریه‌ی پرداخت‌شده</p>
            <p className="mt-1 text-xs text-muted">{n(d.paid)} از {n(d.students)}</p>
          </div>
        </Spot>
        <Spot className="spot-lift p-5">
          <p className="text-4xl font-black text-rose"><CountUp value={d.unpaid} format={n} /></p>
          <p className="mt-1 text-sm text-muted">منتظر پرداخت</p>
          {d.outstanding > 0 && <p className="mt-1 text-xs text-fg/60">{toman(d.outstanding)}</p>}
        </Spot>
        <Spot className="spot-lift p-5">
          <p className="text-4xl font-black text-amber"><CountUp value={d.lowSessions} format={n} /></p>
          <p className="mt-1 text-sm text-muted">بسته‌ی رو به اتمام</p>
        </Spot>
      </section>

      <RequestsPanel onChange={load} />

      {d.pendingSessions.length > 0 && (
        <section className="rounded-3xl border border-amber/30 bg-amber/[0.04] p-6">
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 animate-pulseGlow rounded-full bg-amber" style={{ boxShadow: "0 0 12px rgb(var(--amber))" }} />
            <h2 className="font-bold text-amber">جلسه‌هایی که منتظر ثبت‌اند</h2>
          </div>
          <p className="mt-1 text-xs text-muted">با ثبت «برگزار شد»، یک جلسه از بسته‌ی زبان‌آموز کم می‌شود.</p>
          <ul className="mt-3">
            {d.pendingSessions.map((s) => <SessionRow key={s.id} s={s} onChange={load} dateLabel={dateLongFa(s.startsAt)} />)}
          </ul>
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="h-sec mb-3">جلسه‌های پیش رو</h2>
          {d.upcomingSessions.length === 0 ? (
            <Spot className="p-6 text-sm text-muted">جلسه‌ای در پیش نیست. از «برنامه‌ی کلاس‌ها» جلسه اضافه کنید.</Spot>
          ) : (
            <ul className="timeline">
              {d.upcomingSessions.map((s) => (
                <li key={s.id} className="py-1.5">
                  <Spot className="spot-lift flex items-center justify-between gap-3 px-5 py-4">
                    <span className="font-bold">{s.studentName}</span>
                    <span className="text-sm text-muted">{dateLongFa(s.startsAt)}، {timeFa(s.startsAt)}</span>
                  </Spot>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="h-sec mb-3">نیاز به پیگیری</h2>
          {d.needsAttention.length === 0 ? (
            <Spot className="p-6 text-sm text-muted">همه‌چیز مرتب است.</Spot>
          ) : (
            <ul className="space-y-3">
              {d.needsAttention.map((s) => (
                <li key={s.id}>
                  <Spot className="spot-lift flex items-center gap-4 p-4">
                    <Ring value={s.sessionsTotal ? s.sessionsHeld / s.sessionsTotal : 0} size={56} stroke={6}>
                      <span className="text-sm font-black">{n(s.sessionsLeft)}</span>
                    </Ring>
                    <div className="min-w-0 flex-1">
                      <Link href={`/students/${s.id}`} className="block truncate font-bold hover:text-neon">{s.name}</Link>
                      <div className="mt-1.5 flex items-center gap-2">
                        <StatusBadge status={s.paymentStatus} />
                        <Beads total={s.sessionsTotal} left={s.sessionsLeft} />
                      </div>
                    </div>
                    <button onClick={() => pay(s)} className="btn-neon btn-sm">ثبت پرداخت</button>
                  </Spot>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
