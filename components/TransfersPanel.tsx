"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { dateTimeFa, toman } from "@/lib/format";
import type { Transfer } from "@/lib/types";

/** Card-to-card payments waiting for the teacher to confirm. Renders nothing when there are none. */
export function TransfersPanel({ onChange }: { onChange: () => void }) {
  const [list, setList] = useState<Transfer[]>([]);
  const [busy, setBusy] = useState("");
  const load = useCallback(() => { api<Transfer[]>("/transfers").then(setList).catch(() => {}); }, []);
  useEffect(load, [load]);

  const act = async (t: Transfer, kind: "approve" | "reject") => {
    if (kind === "approve" && !confirm(`اول در برنامه‌ی بانک ببینید ${toman(t.amount)} از ${t.studentName} واقعاً به کارتتان واریز شده. پرداخت ثبت شود؟`)) return;
    let note = "";
    if (kind === "reject") {
      const n = window.prompt("دلیل رد (اختیاری؛ برای زبان‌آموز فرستاده می‌شود)");
      if (n === null) return;
      note = n;
    }
    setBusy(t.id);
    try { await api(`/transfers/${t.id}/${kind}`, { method: "POST", body: { note } }); load(); onChange(); }
    catch (e) { alert(e instanceof Error ? e.message : "خطا"); load(); }
    finally { setBusy(""); }
  };

  if (list.length === 0) return null;
  return (
    <section className="rounded-3xl border border-lime/30 bg-lime/[0.05] p-6">
      <div className="flex items-center gap-3">
        <span className="h-2.5 w-2.5 animate-pulseGlow rounded-full bg-lime" />
        <h2 className="font-bold text-lime">پرداخت‌های کارت‌به‌کارت در انتظار تأیید</h2>
      </div>
      <ul className="mt-4 space-y-3">
        {list.map((t) => (
          <li key={t.id} className="rounded-2xl border border-line bg-panel/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 text-sm leading-7">
                <p className="font-bold">{t.studentName} <span className="font-black text-lime">{toman(t.amount)}</span></p>
                <p className="text-muted">
                  ۴ رقم آخر کارت پرداخت‌کننده: <span dir="ltr" className="font-bold text-fg">{t.payerLast4}</span>
                  {t.trackingNo && <> · شماره پیگیری: <span dir="ltr" className="font-bold text-fg">{t.trackingNo}</span></>}
                </p>
                {t.submittedAt && <p className="text-xs text-muted">{dateTimeFa(t.submittedAt)}</p>}
              </div>
              <div className="flex gap-2">
                <button disabled={busy === t.id} onClick={() => act(t, "approve")} className="btn-primary btn-sm">تأیید دریافت</button>
                <button disabled={busy === t.id} onClick={() => act(t, "reject")} className="btn-danger btn-sm">رد</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
