"use client";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { dateLongFa, n, timeFa } from "@/lib/format";
import { tehranKey } from "@/lib/jalali";
import { Modal } from "@/components/Modal";
import type { Session, SessionStatus, Slot } from "@/lib/types";

const LABEL: Record<SessionStatus, string> = {
  scheduled: "برنامه‌ریزی شده", held: "برگزار شد", absent: "غایب", cancelled: "لغو شد",
};
const TONE: Record<SessionStatus, string> = {
  scheduled: "text-muted", held: "text-lime", absent: "text-rose", cancelled: "text-muted line-through",
};

const hasNotes = (s: Session) => !!(s.summary || s.homework || s.weak);

function NotesModal({ s, onClose, onSaved }: { s: Session; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ summary: s.summary ?? "", homework: s.homework ?? "", weak: s.weak ?? "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try { await api(`/sessions/${s.id}/notes`, { method: "PUT", body: f }); onSaved(); }
    catch (e2) { setErr(e2 instanceof Error ? e2.message : "خطا"); }
    finally { setBusy(false); }
  };
  return (
    <Modal title={`یادداشت جلسه‌ی ${s.studentName}`} onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <div><label className="label">چه چیزی تدریس شد؟</label><textarea rows={3} maxLength={2000} className="input" value={f.summary} onChange={(e) => setF({ ...f, summary: e.target.value })} /></div>
        <div><label className="label">تکلیف</label><textarea rows={3} maxLength={2000} className="input" value={f.homework} onChange={(e) => setF({ ...f, homework: e.target.value })} /></div>
        <div><label className="label">نقاط ضعف و نکته‌ها</label><textarea rows={3} maxLength={2000} className="input" value={f.weak} onChange={(e) => setF({ ...f, weak: e.target.value })} /></div>
        <p className="text-xs leading-6 text-muted">زبان‌آموز این یادداشت‌ها را در پروفایل خودش می‌بیند و با اولین ثبت، اعلان می‌گیرد.</p>
        {err && <p role="alert" className="text-sm text-rose">{err}</p>}
        <div className="flex justify-end"><button disabled={busy} className="btn-primary">ذخیره</button></div>
      </form>
    </Modal>
  );
}

function MakeupModal({ s, onClose, onSaved }: { s: Session; onClose: () => void; onSaved: () => void }) {
  const [dur, setDur] = useState(String(s.durationMin));
  const [days, setDays] = useState(14);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [pick, setPick] = useState<string | null>(null);
  const [custom, setCustom] = useState(false);
  const [when, setWhen] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // free times inside the teacher's working hours (refetched when the length or range changes)
  useEffect(() => {
    const d = Number(dur);
    if (!(d >= 10 && d <= 480)) return;
    setSlots(null);
    const t = setTimeout(() => {
      api<Slot[]>(`/schedule/free?duration=${d}&days=${days}`)
        .then((r) => { setSlots(r); setPick((p) => (p && r.some((x) => x.startsAt === p) ? p : r[0]?.startsAt ?? null)); })
        .catch((e: Error) => setErr(e.message));
    }, 350);
    return () => clearTimeout(t);
  }, [dur, days]);

  const groups = useMemo(() => {
    const m = new Map<string, { label: string; items: Slot[] }>();
    (slots ?? []).forEach((x) => {
      const k = tehranKey(new Date(x.startsAt).getTime());
      if (!m.has(k)) m.set(k, { label: dateLongFa(x.startsAt), items: [] });
      m.get(k)!.items.push(x);
    });
    return Array.from(m.values());
  }, [slots]);

  const save = async (iso: string) => {
    setBusy(true); setErr("");
    try {
      await api("/sessions", { method: "POST", body: { studentId: s.studentId, startsAt: iso, durationMin: Number(dur), count: 1, makeupFor: s.id } });
      onSaved();
    } catch (e2) { setErr(e2 instanceof Error ? e2.message : "خطا"); }
    finally { setBusy(false); }
  };

  const first = slots?.[0];
  const chosen = custom ? (when ? new Date(when).toISOString() : null) : pick;

  return (
    <Modal title={`جلسه‌ی جبرانی برای ${s.studentName}`} onClose={onClose}>
      <div className="space-y-5">
        <div>
          <label className="label" htmlFor="mk-dur">مدت جلسه (دقیقه)</label>
          <input id="mk-dur" type="number" min={10} max={480} className="input w-32" value={dur} onChange={(e) => setDur(e.target.value)} />
        </div>

        {!slots && !err && <p className="text-sm text-muted">در حال یافتن زمان‌های خالی…</p>}

        {first && !custom && (
          <div className="rounded-2xl border border-neon/40 bg-neon/10 p-4">
            <p className="text-xs font-medium text-neon">پیشنهاد سایت: اولین زمان خالی شما</p>
            <p className="mt-1 text-lg font-black">{dateLongFa(first.startsAt)}، ساعت {timeFa(first.startsAt)}</p>
            <button disabled={busy} onClick={() => save(first.startsAt)} className="btn-primary btn-sm mt-3">ثبت همین زمان</button>
          </div>
        )}

        {((slots && slots.length > 0) || custom) && (
          <p role="note" className="flex items-start gap-2 rounded-xl border border-amber/30 bg-amber/10 px-3 py-2.5 text-xs leading-6 text-amber">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-1 h-4 w-4 shrink-0" aria-hidden>
              <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
            </svg>
            <span>ساعت‌های بالا زمان <b>شروع کلاس</b> است. لطفاً زمان رسیدن به کلاس را هم در نظر داشته باشید.</span>
          </p>
        )}

        {slots && slots.length === 0 && (
          <p className="rounded-lg bg-amber/10 px-3 py-2 text-sm leading-7 text-amber">
            در {n(days)} روز آینده زمان خالی پیدا نشد. روزهای بیشتری را ببینید یا ساعت‌های کاری را از «تنظیمات» تغییر دهید.
          </p>
        )}

        {groups.length > 0 && !custom && (
          <div>
            <p className="label">همه‌ی زمان‌های خالی؛ یکی را انتخاب کنید</p>
            <div className="max-h-64 space-y-3 overflow-y-auto rounded-2xl border border-line bg-panel/40 p-3">
              {groups.map((g) => (
                <div key={g.label}>
                  <p className="mb-1.5 text-xs font-bold text-muted">{g.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {g.items.map((x) => (
                      <button
                        key={x.startsAt} type="button" onClick={() => setPick(x.startsAt)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-bold tabular-nums transition-all duration-200 ${
                          pick === x.startsAt ? "border-neon/60 bg-neon/15 text-neon shadow-[0_0_14px_-4px_rgb(var(--neon)/.6)]" : "border-line bg-panel/60 hover:border-neon/30"
                        }`}
                      >
                        {timeFa(x.startsAt)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {days < 60 && (
              <button type="button" onClick={() => setDays((d) => Math.min(60, d + 14))} className="mt-2 text-xs text-neon hover:underline">نمایش روزهای بیشتر</button>
            )}
          </div>
        )}

        <div>
          <button type="button" onClick={() => setCustom((c) => !c)} className="text-xs text-fg/60 underline transition-colors hover:text-neon">
            {custom ? "بازگشت به زمان‌های پیشنهادی" : "زمان دلخواه خودم را وارد می‌کنم"}
          </button>
          {custom && (
            <input type="datetime-local" className="input mt-2" value={when} onChange={(e) => setWhen(e.target.value)} />
          )}
        </div>

        {err && <p role="alert" className="text-sm text-rose">{err}</p>}
        <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
          <span className="text-xs text-muted">
            {chosen ? `${dateLongFa(chosen)}، ${timeFa(chosen)}` : "زمانی انتخاب نشده"}
          </span>
          <button disabled={busy || !chosen} onClick={() => chosen && save(chosen)} className="btn-primary">ثبت جبرانی</button>
        </div>
      </div>
    </Modal>
  );
}

export function SessionRow({ s, onChange, dateLabel }: { s: Session; onChange: () => void; dateLabel?: string }) {
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<"notes" | "makeup" | null>(null);
  const [open, setOpen] = useState(false); // notes expanded?
  const set = async (status: SessionStatus) => {
    setBusy(true);
    try { await api(`/sessions/${s.id}`, { method: "PATCH", body: { status } }); onChange(); }
    catch (e) { alert(e instanceof Error ? e.message : "خطا"); }
    finally { setBusy(false); }
  };
  const done = () => { setModal(null); onChange(); };

  // one button per row of actions; on phones they share the full width equally
  const btn = "flex-1 sm:flex-none";

  return (
    <li className="py-1.5">
      <div className="rounded-2xl border border-line bg-panel/50 p-3.5 transition-all duration-300 hover:border-neon/30 hover:bg-panel/80">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          {/* who / when */}
          <div className="flex min-w-0 items-start gap-3 sm:flex-1">
            <span className="grid h-12 w-16 shrink-0 place-items-center rounded-xl bg-neon/10 text-sm font-black tabular-nums text-neon shadow-[inset_0_0_14px_rgb(var(--neon)/.12)]">
              {timeFa(s.startsAt)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="break-words text-sm font-bold">{s.studentName}</span>
                {s.isMakeup && <span className="rounded-full bg-violet/15 px-2 py-0.5 text-[11px] text-violet">جبرانی</span>}
                {s.rating && (
                  <span className={`rounded-full px-2 py-0.5 text-[11px] ${s.rating === "good" ? "bg-lime/15 text-lime" : s.rating === "ok" ? "bg-amber/15 text-amber" : "bg-rose/15 text-rose"}`}>
                    نظر: {s.rating === "good" ? "خوب" : s.rating === "ok" ? "معمولی" : "بد"}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs leading-5 text-muted">{dateLabel ? `${dateLabel}، ` : ""}{n(s.durationMin)} دقیقه</p>
            </div>
            {s.status !== "scheduled" && (
              <span className={`shrink-0 text-xs font-medium sm:hidden ${TONE[s.status]}`}>{LABEL[s.status]}</span>
            )}
          </div>

          {/* status (desktop) + actions */}
          <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3 sm:border-0 sm:pt-0">
            {s.status !== "scheduled" && (
              <span className={`hidden text-sm font-medium sm:inline ${TONE[s.status]}`}>{LABEL[s.status]}</span>
            )}
            {s.status === "scheduled" ? (
              <>
                <button disabled={busy} onClick={() => set("held")} className={`btn-primary btn-sm ${btn}`}>برگزار شد</button>
                <button disabled={busy} onClick={() => set("absent")} className={`btn-ghost btn-sm ${btn}`}>غایب</button>
                <button disabled={busy} onClick={() => set("cancelled")} className={`btn-ghost btn-sm ${btn}`}>لغو</button>
              </>
            ) : (
              <>
                {(s.status === "held" || s.status === "absent") && (
                  <button onClick={() => setModal("notes")} className={`btn-ghost btn-sm ${btn}`}>{hasNotes(s) ? "ویرایش یادداشت" : "یادداشت و تکلیف"}</button>
                )}
                {(s.status === "cancelled" || s.status === "absent") && (
                  <button onClick={() => setModal("makeup")} className={`btn-ghost btn-sm ${btn}`}>جبرانی</button>
                )}
                <button disabled={busy} onClick={() => set("scheduled")} className={`btn-ghost btn-sm ${btn}`}>بازگردانی</button>
              </>
            )}
          </div>
        </div>

        {s.feedbackText && (
          <div className="mt-3 rounded-xl bg-violet/10 p-3 text-sm leading-7">
            <p className="label">پیشنهاد زبان‌آموز</p>
            <p className="whitespace-pre-wrap break-words">{s.feedbackText}</p>
          </div>
        )}

        {/* saved notes: a short preview, expandable */}
        {hasNotes(s) && (
          <div className="mt-3 rounded-xl bg-fg/[0.04] p-3 text-sm leading-7">
            {open ? (
              <dl className="space-y-2.5">
                {s.summary && <div><dt className="label">درس</dt><dd className="whitespace-pre-wrap break-words">{s.summary}</dd></div>}
                {s.homework && <div><dt className="label">تکلیف</dt><dd className="whitespace-pre-wrap break-words">{s.homework}</dd></div>}
                {s.weak && <div><dt className="label">نقاط ضعف و نکته‌ها</dt><dd className="whitespace-pre-wrap break-words">{s.weak}</dd></div>}
              </dl>
            ) : (
              <p className="line-clamp-2 break-words text-fg/80">
                <span className="text-muted">{s.homework ? "تکلیف: " : "درس: "}</span>
                {s.homework || s.summary || s.weak}
              </p>
            )}
            <button onClick={() => setOpen((o) => !o)} className="mt-1.5 text-xs font-medium text-neon hover:underline">
              {open ? "بستن" : "نمایش همه‌ی یادداشت"}
            </button>
          </div>
        )}
      </div>
      {modal === "notes" && <NotesModal s={s} onClose={() => setModal(null)} onSaved={done} />}
      {modal === "makeup" && <MakeupModal s={s} onClose={() => setModal(null)} onSaved={done} />}
    </li>
  );
}
