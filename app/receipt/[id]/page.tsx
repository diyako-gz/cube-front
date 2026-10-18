"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, tokenStore } from "@/lib/api";
import { dateFa, n, timeFa, toman } from "@/lib/format";
import type { Receipt } from "@/lib/types";

export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [r, setR] = useState<Receipt | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!tokenStore.get()) { router.replace("/login"); return; }
    api<Receipt>(`/payments/${id}`).then(setR).catch((e: Error) => setErr(e.message));
  }, [id, router]);

  if (err) return <div className="grid min-h-screen place-items-center text-rose">{err}</div>;
  if (!r) return <div className="grid min-h-screen place-items-center text-muted">در حال بارگذاری…</div>;
  const p = r.payment;

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="no-print mb-6 flex flex-wrap justify-between gap-3">
        <button onClick={() => router.back()} className="btn-ghost btn-sm">بازگشت</button>
        <button onClick={() => window.print()} className="btn-primary btn-sm">چاپ / ذخیره PDF</button>
      </div>

      <article className="neon-border">
        <div className="rounded-[22px] bg-panel p-8 sm:p-10">
          <div className="flex items-start justify-between gap-4 border-b border-line pb-6">
            <div>
              <p className="text-xs text-muted">CUBE</p>
              <h1 className="mt-1 text-2xl font-black">رسید پرداخت شهریه</h1>
            </div>
            <div className="text-end text-sm">
              <p className="text-muted">شماره‌ی رسید</p>
              <p className="font-bold tracking-wider" dir="ltr">{r.number}</p>
            </div>
          </div>

          <dl className="space-y-4 py-6 text-sm">
            {[
              ["پرداخت‌کننده", p.studentName],
              ["دریافت‌کننده", r.teacherName],
              ["تاریخ پرداخت", `${dateFa(p.paidAt)}، ${timeFa(p.paidAt)}`],
              ...(r.packageSessions ? [["بسته", `${n(r.packageSessions)} جلسه`]] : []),
              ...(r.nextDueAt ? [["سررسید بعدی", dateFa(r.nextDueAt)]] : []),
              ...(p.note ? [["توضیح", p.note]] : []),
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-muted">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="flex items-center justify-between rounded-2xl bg-neon/10 px-6 py-5">
            <span className="font-bold">مبلغ پرداخت‌شده</span>
            <span className="text-2xl font-black">{toman(p.amount)}</span>
          </div>
          <p className="mt-6 text-center text-xs text-muted">این رسید به‌صورت خودکار از CUBE صادر شده است.</p>
        </div>
      </article>
    </div>
  );
}
