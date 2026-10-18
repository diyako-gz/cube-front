"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { dateLongFa, dateTimeFa, timeFa } from "@/lib/format";
import type { SessionRequest } from "@/lib/types";

export function RequestsPanel({ onChange }: { onChange: () => void }) {
  const [list, setList] = useState<SessionRequest[]>([]);
  const [busy, setBusy] = useState("");

  const load = useCallback(() => {
    api<SessionRequest[]>("/requests").then(setList).catch(() => {});
  }, []);
  useEffect(load, [load]);

  const act = async (id: string, kind: "approve" | "reject", body: object = {}) => {
    setBusy(id);
    try { await api(`/requests/${id}/${kind}`, { method: "POST", body }); load(); onChange(); }
    catch (e) { alert(e instanceof Error ? e.message : "خطا"); load(); }
    finally { setBusy(""); }
  };
  const reject = (id: string) => {
    const note = window.prompt("دلیل رد (اختیاری؛ برای زبان‌آموز فرستاده می‌شود)");
    if (note !== null) act(id, "reject", { note });
  };

  if (list.length === 0) return null;
  return (
    <section className="rounded-3xl border border-violet/30 bg-violet/[0.05] p-6">
      <div className="flex items-center gap-3">
        <span className="h-2.5 w-2.5 animate-pulseGlow rounded-full bg-violet" />
        <h2 className="font-bold text-violet">درخواست‌های زبان‌آموزان</h2>
      </div>
      <ul className="mt-4 space-y-3">
        {list.map((r) => (
          <li key={r.id} className="rounded-2xl border border-line bg-panel/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold">
                  {r.studentName} <span className="font-normal text-muted">— {r.type === "cancel" ? "درخواست لغو" : "درخواست جابه‌جایی"}</span>
                </p>
                <p className="mt-1 text-sm text-fg/70">
                  جلسه‌ی {dateLongFa(r.sessionAt)}، {timeFa(r.sessionAt)}
                  {r.type === "reschedule" && r.proposedAt && <> ← {dateTimeFa(r.proposedAt)}</>}
                </p>
                {r.note && <p className="mt-1 text-sm text-muted">«{r.note}»</p>}
                {r.late && <p className="mt-1 text-xs text-amber">نزدیک به زمان کلاس درخواست شده است.</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <button disabled={busy === r.id} onClick={() => act(r.id, "approve")} className="btn-primary btn-sm">
                  {r.type === "cancel" ? "تأیید لغو" : "تأیید جابه‌جایی"}
                </button>
                {r.type === "cancel" && r.late && (
                  <button disabled={busy === r.id} onClick={() => act(r.id, "approve", { charge: true })} className="btn-ghost btn-sm">تأیید، با کسر جلسه</button>
                )}
                <button disabled={busy === r.id} onClick={() => reject(r.id)} className="btn-danger btn-sm">رد</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
