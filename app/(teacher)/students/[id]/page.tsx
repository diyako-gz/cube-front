"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, recordPayment } from "@/lib/api";
import { dateFa, dateLongFa, n, toman } from "@/lib/format";
import { Beads } from "@/components/Beads";
import { CountUp } from "@/components/CountUp";
import { Modal } from "@/components/Modal";
import { Ring } from "@/components/Ring";
import { SessionRow } from "@/components/SessionRow";
import { Spot } from "@/components/Spot";
import { StatusBadge } from "@/components/StatusBadge";
import { StudentForm } from "@/components/StudentForm";
import { Tabs } from "@/components/Tabs";
import type { Payment, Session, Student } from "@/lib/types";

interface Detail { student: Student; payments: Payment[]; sessions: Session[] }
type Tab = "sessions" | "payments" | "info";

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted">{k}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [d, setD] = useState<Detail | null>(null);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState<Tab>("sessions");
  const [editing, setEditing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const load = useCallback(() => {
    api<Detail>(`/students/${id}`).then(setD).catch((e: Error) => setErr(e.message));
  }, [id]);
  useEffect(load, [load]);

  if (err) return <p className="text-rose">{err}</p>;
  if (!d) return <p className="text-muted">در حال بارگذاری…</p>;
  const s = d.student;

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (await recordPayment(id, { amount: Number(amount || s.price), note })) { setPaying(false); setNote(""); load(); }
    } catch (e2) { alert(e2 instanceof Error ? e2.message : "خطا"); }
  };

  const remove = async () => {
    if (!confirm(`«${s.name}» و جلسه‌هایش حذف شود؟ سابقه‌ی پرداخت‌ها در گزارش درآمد می‌ماند.`)) return;
    await api(`/students/${id}`, { method: "DELETE" });
    router.replace("/students");
  };

  return (
    <div className="space-y-8">
      <div>
        <Link href="/students" className="text-sm text-muted transition-colors hover:text-neon">بازگشت به زبان‌آموزان</Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="h-page text-4xl sm:text-5xl">{s.name}</h1>
            <p className="mt-2 text-sm text-muted">{[s.language, s.phone].filter(Boolean).join("، ") || "—"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-neon" onClick={() => { setAmount(String(s.price)); setPaying(true); }}>ثبت پرداخت</button>
            <button className="btn-ghost" onClick={() => setEditing(true)}>ویرایش</button>
            <button className="btn-danger" onClick={remove}>حذف</button>
          </div>
        </div>
      </div>

      <section className="grid items-start gap-6 lg:grid-cols-[350px_1fr]">
        <Spot className="p-8 text-center">
          <Ring value={s.sessionsTotal ? s.sessionsHeld / s.sessionsTotal : 0} size={200} stroke={13}>
            <div>
              <p className="glow text-6xl font-black"><CountUp value={s.sessionsLeft} format={n} /></p>
              <p className="mt-1 text-xs text-muted">جلسه مانده</p>
            </div>
          </Ring>
          <p className="mt-5 text-sm text-fg/70">{n(s.sessionsHeld)} از {n(s.sessionsTotal)} جلسه برگزار شده</p>
          <div className="mt-4 flex justify-center"><Beads total={s.sessionsTotal} left={s.sessionsLeft} size="lg" /></div>
          <dl className="mt-7 space-y-3.5 border-t border-line pt-6 text-sm">
            <Row k="شهریه"><StatusBadge status={s.paymentStatus} /></Row>
            <Row k="آخرین پرداخت">{dateFa(s.lastPaidAt)}</Row>
            <Row k="سررسید بعدی">
              {dateFa(s.nextDueAt)}
              {s.daysToDue !== null && s.daysToDue >= 0 && <span className="text-xs text-muted"> ({n(s.daysToDue)} روز)</span>}
            </Row>
            <Row k="هر بسته">{toman(s.price)}</Row>
          </dl>
        </Spot>

        <div className="space-y-5">
          <Tabs<Tab>
            value={tab} onChange={setTab}
            items={[
              { id: "sessions", label: `جلسه‌ها (${n(d.sessions.length)})` },
              { id: "payments", label: `پرداخت‌ها (${n(d.payments.length)})` },
              { id: "info", label: "اطلاعات" },
            ]}
          />

          <div key={tab} className="animate-fade">
            {tab === "sessions" && (
              d.sessions.length === 0 ? (
                <Spot className="p-8 text-center text-sm text-muted">جلسه‌ای ثبت نشده است. از «برنامه‌ی کلاس‌ها» اضافه کنید.</Spot>
              ) : (
                <ul className="timeline">
                  {d.sessions.map((x) => <SessionRow key={x.id} s={x} onChange={load} dateLabel={dateLongFa(x.startsAt)} />)}
                </ul>
              )
            )}

            {tab === "payments" && (
              d.payments.length === 0 ? (
                <Spot className="p-8 text-center text-sm text-muted">هنوز پرداختی ثبت نشده است.</Spot>
              ) : (
                <ul className="space-y-3">
                  {d.payments.map((p) => (
                    <li key={p.id}>
                      <Spot className="flex items-center justify-between gap-4 px-6 py-4">
                        <div>
                          <p className="font-bold">{toman(p.amount)}</p>
                          {p.note && <p className="mt-0.5 text-xs text-muted">{p.note}</p>}
                        </div>
                        <span className="flex items-center gap-4 text-sm text-muted">{dateFa(p.paidAt)}<Link href={`/receipt/${p.id}`} className="text-neon hover:underline">رسید</Link></span>
                      </Spot>
                    </li>
                  ))}
                </ul>
              )
            )}

            {tab === "info" && (
              <Spot className="grid gap-6 p-8 sm:grid-cols-2">
                <div><p className="label">شماره تماس</p><p className="font-medium" dir="ltr">{s.phone || "—"}</p></div>
                <div><p className="label">نام کاربری ورود</p><p className="font-medium" dir="ltr">{s.username}</p></div>
                <div><p className="label">جلسه در هر بسته</p><p className="font-medium">{n(s.packageSessions)} جلسه</p></div>
                <div><p className="label">دوره‌ی پرداخت</p><p className="font-medium">هر {n(s.cycleDays)} روز</p></div>
                <div className="sm:col-span-2"><p className="label">یادداشت</p><p className="leading-8 text-fg/80">{s.notes || "—"}</p></div>
              </Spot>
            )}
          </div>
        </div>
      </section>

      {editing && (
        <Modal title="ویرایش زبان‌آموز" onClose={() => setEditing(false)}>
          <StudentForm initial={s} onDone={() => { setEditing(false); load(); }} />
        </Modal>
      )}
      {paying && (
        <Modal title="ثبت پرداخت شهریه" onClose={() => setPaying(false)}>
          <form onSubmit={submitPayment} className="space-y-4">
            <div><label className="label">مبلغ (تومان)</label><input required type="number" min={1} className="input" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
            <div><label className="label">توضیح (اختیاری)</label><input className="input" value={note} onChange={(e) => setNote(e.target.value)} /></div>
            <p className="text-xs leading-6 text-muted">
              با ثبت پرداخت، سررسید بعدی {n(s.cycleDays)} روز جلوتر می‌رود و {s.lastPaidAt ? `${n(s.packageSessions)} جلسه به بسته اضافه می‌شود` : "بسته‌ی فعلی پرداخت‌شده حساب می‌شود"}.
            </p>
            <div className="flex justify-end"><button className="btn-neon">ثبت پرداخت</button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
