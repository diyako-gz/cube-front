"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { n, timeFa } from "@/lib/format";
import { Modal } from "@/components/Modal";
import type { Session, SessionStatus } from "@/lib/types";

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
  const [when, setWhen] = useState("");
  const [dur, setDur] = useState(String(s.durationMin));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      await api("/sessions", {
        method: "POST",
        body: { studentId: s.studentId, startsAt: new Date(when).toISOString(), durationMin: Number(dur), count: 1, makeupFor: s.id },
      });
      onSaved();
    } catch (e2) { setErr(e2 instanceof Error ? e2.message : "خطا"); }
    finally { setBusy(false); }
  };
  return (
    <Modal title={`جلسه‌ی جبرانی برای ${s.studentName}`} onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <div><label className="label">زمان جلسه‌ی جبرانی</label><input required type="datetime-local" className="input" value={when} onChange={(e) => setWhen(e.target.value)} /></div>
        <div><label className="label">مدت (دقیقه)</label><input required type="number" min={10} max={480} className="input" value={dur} onChange={(e) => setDur(e.target.value)} /></div>
        {err && <p role="alert" className="text-sm text-rose">{err}</p>}
        <div className="flex justify-end"><button disabled={busy} className="btn-primary">ثبت جلسه‌ی جبرانی</button></div>
      </form>
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
