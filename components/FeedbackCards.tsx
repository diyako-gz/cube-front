"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { dateLongFa, timeFa } from "@/lib/format";
import { Spot } from "@/components/Spot";
import type { Session } from "@/lib/types";

export const RATINGS = [
  { id: "good", label: "خوب", face: "😊", on: "border-lime/60 bg-lime/15 text-lime" },
  { id: "ok", label: "معمولی", face: "😐", on: "border-amber/60 bg-amber/15 text-amber" },
  { id: "bad", label: "بد", face: "😕", on: "border-rose/60 bg-rose/15 text-rose" },
] as const;
type Rating = (typeof RATINGS)[number]["id"];

function FeedbackCard({ s, onDone }: { s: Session; onDone: () => void }) {
  const [rating, setRating] = useState<Rating | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const send = async () => {
    if (!rating) return;
    setBusy(true); setErr("");
    try {
      await api(`/portal/feedback/${s.id}`, { method: "POST", body: { rating, text } });
      setDone(true);
      setTimeout(onDone, 1600);
    } catch (e) { setErr(e instanceof Error ? e.message : "خطا"); }
    finally { setBusy(false); }
  };

  if (done) {
    return <Spot className="p-6 text-center"><p className="font-bold text-lime">ممنون! نظر شما ثبت شد.</p></Spot>;
  }
  return (
    <Spot className="p-5 sm:p-6">
      <p className="text-xs text-muted">{dateLongFa(s.startsAt)}، ساعت {timeFa(s.startsAt)}</p>
      <h3 className="mt-1 text-lg font-black">کلاس چطور بود؟</h3>
      <div className="mt-4 grid grid-cols-3 gap-2" role="radiogroup" aria-label="نظر شما درباره‌ی کلاس">
        {RATINGS.map((r) => (
          <button
            key={r.id} type="button" role="radio" aria-checked={rating === r.id} onClick={() => setRating(r.id)}
            className={`flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-sm font-bold transition-all duration-300 ${
              rating === r.id ? `${r.on} -translate-y-0.5` : "border-line bg-panel/50 text-fg/70 hover:border-neon/30"
            }`}
          >
            <span className="text-2xl" aria-hidden>{r.face}</span>
            {r.label}
          </button>
        ))}
      </div>
      {rating && (
        <div className="animate-fade mt-4 space-y-3">
          <label className="label" htmlFor={`fb-${s.id}`}>پیشنهاد یا نظر شما برای معلم (اختیاری)</label>
          <textarea id={`fb-${s.id}`} rows={3} maxLength={1000} className="input" value={text} onChange={(e) => setText(e.target.value)} />
          {err && <p role="alert" className="text-sm text-rose">{err}</p>}
          <button disabled={busy} onClick={send} className="btn-primary btn-sm">ارسال نظر</button>
        </div>
      )}
    </Spot>
  );
}

/** Asks the student about classes that were held and not rated yet. */
export function FeedbackCards({ sessions, onDone }: { sessions: Session[]; onDone: () => void }) {
  if (sessions.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="h-sec">نظر شما درباره‌ی کلاس‌ها</h2>
      {sessions.map((s) => <FeedbackCard key={s.id} s={s} onDone={onDone} />)}
    </section>
  );
}
