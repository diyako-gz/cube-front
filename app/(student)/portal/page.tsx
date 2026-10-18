"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { dateFa, dateLongFa, dateTimeFa, n, timeFa, toman } from "@/lib/format";
import { Beads } from "@/components/Beads";
import { CountUp } from "@/components/CountUp";
import { Modal } from "@/components/Modal";
import { Ring } from "@/components/Ring";
import { Spot } from "@/components/Spot";
import { StatusBadge } from "@/components/StatusBadge";
import type { Portal, Session, SessionRequest } from "@/lib/types";

const REQ_LABEL = { pending: "در انتظار پاسخ", approved: "تأیید شد", rejected: "رد شد" } as const;
const REQ_TONE = { pending: "text-amber", approved: "text-lime", rejected: "text-rose" } as const;
const NOTICE_HOURS = 12;

function RequestModal({
  session, type, onClose, onDone,
}: { session: Session; type: "cancel" | "reschedule"; onClose: () => void; onDone: () => void }) {
  const [when, setWhen] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const late = new Date(session.startsAt).getTime() - Date.now() < NOTICE_HOURS * 3600e3;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      await api("/portal/requests", {
        method: "POST",
        body: { sessionId: session.id, type, note, proposedAt: type === "reschedule" ? new Date(when).toISOString() : undefined },
      });
      onDone();
    } catch (e2) { setErr(e2 instanceof Error ? e2.message : "خطا"); }
    finally { setBusy(false); }
  };

  return (
    <Modal title={type === "cancel" ? "درخواست لغو جلسه" : "درخواست جابه‌جایی جلسه"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="rounded-lg bg-neon/10 px-3 py-2 text-sm">جلسه‌ی {dateLongFa(session.startsAt)}، ساعت {timeFa(session.startsAt)}</p>
        {type === "reschedule" && (
          <div><label className="label">زمان پیشنهادی شما</label><input required type="datetime-local" className="input" value={when} onChange={(e) => setWhen(e.target.value)} /></div>
        )}
        <div><label className="label">توضیح (اختیاری)</label><textarea rows={2} maxLength={500} className="input" value={note} onChange={(e) => setNote(e.target.value)} /></div>
        {late && (
          <p className="text-xs leading-6 text-amber">
            کمتر از {n(NOTICE_HOURS)} ساعت به کلاس مانده است؛ معلم ممکن است این جلسه را از بسته‌ی شما کم کند.
          </p>
        )}
        <p className="text-xs leading-6 text-muted">درخواست برای معلم فرستاده می‌شود و بعد از تأیید او اعمال خواهد شد.</p>
        {err && <p role="alert" className="text-sm text-rose">{err}</p>}
        <div className="flex justify-end"><button disabled={busy} className="btn-primary">ارسال درخواست</button></div>
      </form>
    </Modal>
  );
}

export default function PortalPage() {
  const [p, setP] = useState<Portal | null>(null);
  const [err, setErr] = useState("");
  const [req, setReq] = useState<{ session: Session; type: "cancel" | "reschedule" } | null>(null);

  const load = useCallback(() => { api<Portal>("/portal").then(setP).catch((e: Error) => setErr(e.message)); }, []);
  useEffect(load, [load]);

  if (err) return <p className="text-rose">{err}</p>;
  if (!p) return <p className="text-muted">در حال بارگذاری…</p>;
  const s = p.student;

  let remaining = 0;
  if (s.lastPaidAt && s.nextDueAt) {
    const a = new Date(s.lastPaidAt).getTime(), b = new Date(s.nextDueAt).getTime();
    remaining = Math.min(1, Math.max(0, (b - Date.now()) / (b - a)));
  }
  const dueText =
    s.daysToDue === null ? "هنوز پرداختی ثبت نشده"
    : s.daysToDue < 0 ? `${n(-s.daysToDue)} روز از سررسید گذشته`
    : s.daysToDue === 0 ? "امروز سررسید است"
    : `${n(s.daysToDue)} روز تا پرداخت بعدی`;

  const pendingFor = (id: string) => p.requests.find((r: SessionRequest) => r.sessionId === id && r.status === "pending");
  const withNotes = p.recent.filter((x) => x.summary || x.homework || x.weak);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-muted">{p.teacherName ? `کلاس‌های ${p.teacherName}` : "پروفایل شما"}</p>
        <h1 className="h-page mt-2 text-4xl sm:text-5xl">{s.name}</h1>
        {s.language && <p className="mt-2 text-fg/70">{s.language}</p>}
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <Spot className="flex flex-col items-center p-8 text-center">
          <Ring value={s.sessionsTotal ? s.sessionsHeld / s.sessionsTotal : 0} size={210} stroke={14}>
            <div>
              <p className="glow text-6xl font-black"><CountUp value={s.sessionsLeft} format={n} /></p>
              <p className="mt-1 text-xs text-muted">جلسه مانده</p>
            </div>
          </Ring>
          <p className="mt-5 text-sm text-fg/70">{n(s.sessionsHeld)} از {n(s.sessionsTotal)} جلسه برگزار شده</p>
          <div className="mt-4"><Beads total={s.sessionsTotal} left={s.sessionsLeft} size="lg" /></div>
          {s.sessionsTotal > 0 && s.sessionsLeft <= 1 && (
            <p className="mt-5 text-sm text-amber">بسته‌ی شما رو به پایان است. برای ادامه، شهریه را پرداخت کنید.</p>
          )}
        </Spot>

        <Spot className="flex flex-col items-center p-8 text-center">
          <Ring value={remaining} size={210} stroke={14}>
            <div>
              <p className="glow text-6xl font-black">{s.daysToDue !== null && s.daysToDue >= 0 ? <CountUp value={s.daysToDue} format={n} /> : "—"}</p>
              <p className="mt-1 text-xs text-muted">روز تا پرداخت بعدی</p>
            </div>
          </Ring>
          <p className="mt-5 font-bold">{dueText}</p>
          <div className="mt-3"><StatusBadge status={s.paymentStatus} /></div>
          <dl className="mt-6 grid w-full grid-cols-3 gap-3 border-t border-line pt-5 text-sm">
            <div><dt className="label">آخرین پرداخت</dt><dd className="font-medium">{dateFa(s.lastPaidAt)}</dd></div>
            <div><dt className="label">سررسید</dt><dd className="font-medium">{dateFa(s.nextDueAt)}</dd></div>
            <div><dt className="label">هر بسته</dt><dd className="font-medium">{toman(s.price)}</dd></div>
          </dl>
        </Spot>
      </section>

      {withNotes.length > 0 && (
        <section>
          <h2 className="h-sec mb-3">یادداشت‌ها و تکلیف</h2>
          <ul className="space-y-3">
            {withNotes.map((x) => (
              <li key={x.id}>
                <Spot className="p-6">
                  <p className="text-sm font-bold text-neon">{dateLongFa(x.startsAt)}</p>
                  <dl className="mt-3 space-y-3 text-sm leading-7">
                    {x.summary && <div><dt className="label">درس امروز</dt><dd className="whitespace-pre-wrap">{x.summary}</dd></div>}
                    {x.homework && <div><dt className="label">تکلیف</dt><dd className="whitespace-pre-wrap">{x.homework}</dd></div>}
                    {x.weak && <div><dt className="label">نقاط ضعف و نکته‌ها</dt><dd className="whitespace-pre-wrap">{x.weak}</dd></div>}
                  </dl>
                </Spot>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="h-sec mb-3">جلسه‌های بعدی</h2>
          {p.upcoming.length === 0 ? (
            <Spot className="p-6 text-sm text-muted">جلسه‌ی برنامه‌ریزی‌شده‌ای نیست.</Spot>
          ) : (
            <ul className="timeline">
              {p.upcoming.map((x) => {
                const pending = pendingFor(x.id);
                const future = new Date(x.startsAt).getTime() > Date.now();
                return (
                  <li key={x.id} className="py-1.5">
                    <Spot className="px-5 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 font-bold">
                          {dateLongFa(x.startsAt)}
                          {x.isMakeup && <span className="rounded-full bg-violet/15 px-2 py-0.5 text-[11px] font-normal text-violet">جبرانی</span>}
                        </span>
                        <span className="rounded-lg bg-neon/10 px-3 py-1 text-sm font-black tabular-nums text-neon">{timeFa(x.startsAt)}</span>
                      </div>
                      {pending ? (
                        <p className="mt-3 text-xs text-amber">
                          درخواست {pending.type === "cancel" ? "لغو" : "جابه‌جایی"} شما در انتظار پاسخ معلم است.
                        </p>
                      ) : future ? (
                        <div className="mt-3 flex gap-2">
                          <button onClick={() => setReq({ session: x, type: "reschedule" })} className="btn-ghost btn-sm">درخواست جابه‌جایی</button>
                          <button onClick={() => setReq({ session: x, type: "cancel" })} className="btn-ghost btn-sm">درخواست لغو</button>
                        </div>
                      ) : null}
                    </Spot>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div>
          <h2 className="h-sec mb-3">پرداخت‌های قبلی</h2>
          {p.payments.length === 0 ? (
            <Spot className="p-6 text-sm text-muted">هنوز پرداختی ثبت نشده است.</Spot>
          ) : (
            <ul className="space-y-3">
              {p.payments.map((x) => (
                <li key={x.id}>
                  <Spot className="flex items-center justify-between gap-3 px-5 py-4">
                    <span className="font-bold">{toman(x.amount)}</span>
                    <span className="flex items-center gap-4 text-sm text-muted">
                      {dateFa(x.paidAt)}
                      <Link href={`/receipt/${x.id}`} className="text-neon hover:underline">رسید</Link>
                    </span>
                  </Spot>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {p.requests.length > 0 && (
        <section>
          <h2 className="h-sec mb-3">درخواست‌های شما</h2>
          <ul className="space-y-3">
            {p.requests.map((r) => (
              <li key={r.id}>
                <Spot className="px-5 py-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold">
                      {r.type === "cancel" ? "لغو" : "جابه‌جایی"} جلسه‌ی {dateLongFa(r.sessionAt)}
                      {r.type === "reschedule" && r.proposedAt && <span className="font-normal text-muted"> ← {dateTimeFa(r.proposedAt)}</span>}
                    </span>
                    <span className={`font-medium ${REQ_TONE[r.status]}`}>{REQ_LABEL[r.status]}</span>
                  </div>
                  {r.teacherNote && <p className="mt-2 text-muted">پیام معلم: {r.teacherNote}</p>}
                </Spot>
              </li>
            ))}
          </ul>
        </section>
      )}

      {req && (
        <RequestModal session={req.session} type={req.type} onClose={() => setReq(null)} onDone={() => { setReq(null); load(); }} />
      )}
    </div>
  );
}
