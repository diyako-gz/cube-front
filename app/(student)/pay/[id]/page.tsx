"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, apiUpload } from "@/lib/api";
import { n, toman } from "@/lib/format";
import { Ring } from "@/components/Ring";
import { Spot } from "@/components/Spot";
import type { Transfer } from "@/lib/types";

const faDigits = (s: string) => s.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
const spaced = (c: string) => c.replace(/(\d{4})(?=\d)/g, "$1 ");

function CopyRow({ label, value, shown }: { label: string; value: string; shown: string }) {
  const [ok, setOk] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); setOk(true); setTimeout(() => setOk(false), 1800); } catch { /* blocked */ }
  };
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-panel/50 px-4 py-3.5">
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="mt-0.5 break-all text-lg font-black tracking-wide" dir="ltr">{shown}</p>
      </div>
      <button onClick={copy} className="btn-ghost btn-sm shrink-0">{ok ? "کپی شد" : "کپی"}</button>
    </div>
  );
}

export default function PayPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [t, setT] = useState<Transfer | null>(null);
  const [err, setErr] = useState("");
  const [now, setNow] = useState(Date.now());
  const [last4, setLast4] = useState("");
  const [tracking, setTracking] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => { api<Transfer>(`/portal/transfers/${id}`).then(setT).catch((e: Error) => setErr(e.message)); }, [id]);
  useEffect(load, [load]);
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);
  // after "I paid", wait for the teacher: check every few seconds
  useEffect(() => {
    if (t?.status !== "submitted") return;
    const i = setInterval(load, 5000);
    return () => clearInterval(i);
  }, [t?.status, load]);

  if (err) return <p className="text-rose">{err}</p>;
  if (!t) return <p className="text-muted">در حال بارگذاری…</p>;

  const total = Math.max(1, new Date(t.expiresAt).getTime() - new Date(t.createdAt).getTime());
  const left = Math.max(0, new Date(t.expiresAt).getTime() - now);
  const expired = t.status === "expired" || (t.status === "open" && left === 0);
  const mm = faDigits(String(Math.floor(left / 60000)).padStart(2, "0"));
  const ss = faDigits(String(Math.floor((left % 60000) / 1000)).padStart(2, "0"));

  const pickFile = (f: File | null) => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setErr("عکس رسید واریز را پیوست کنید"); return; }
    setBusy(true); setErr("");
    try {
      const form = new FormData();
      form.set("payerLast4", last4);
      form.set("trackingNo", tracking);
      form.set("receipt", file);
      setT(await apiUpload<Transfer>(`/portal/transfers/${id}/submit`, form));
    } catch (e2) { setErr(e2 instanceof Error ? e2.message : "خطا"); load(); }
    finally { setBusy(false); }
  };
  const restart = async () => {
    try { const r = await api<Transfer>("/portal/transfers", { method: "POST" }); router.replace(`/pay/${r.id}`); setT(r); }
    catch (e) { setErr(e instanceof Error ? e.message : "خطا"); }
  };

  const wrap = (children: React.ReactNode) => (
    <div className="mx-auto max-w-xl space-y-6">
      <div><Link href="/portal" className="text-sm text-muted transition-colors hover:text-neon">بازگشت به پروفایل</Link></div>
      {children}
    </div>
  );

  if (t.status === "approved") return wrap(
    <Spot className="p-10 text-center">
      <p className="glow text-5xl">✓</p>
      <h1 className="mt-4 text-2xl font-black text-lime">پرداخت شما تأیید شد</h1>
      <p className="mt-2 text-sm leading-7 text-muted">شهریه تمدید شد و رسید پرداخت در پروفایلتان است.</p>
      <Link href="/portal" className="btn-primary mt-6">رفتن به پروفایل</Link>
    </Spot>);

  if (t.status === "rejected") return wrap(
    <Spot className="p-10 text-center">
      <h1 className="text-2xl font-black text-rose">واریز تأیید نشد</h1>
      {t.teacherNote && <p className="mt-3 text-sm leading-7">پیام معلم: {t.teacherNote}</p>}
      <p className="mt-2 text-sm text-muted">اگر مطمئنید واریز کرده‌اید، با معلم‌تان تماس بگیرید.</p>
      <Link href="/portal" className="btn-ghost mt-6">بازگشت</Link>
    </Spot>);

  if (t.status === "submitted" || t.status === "approving") return wrap(
    <Spot className="p-10 text-center">
      <span className="mx-auto block h-3 w-3 animate-pulseGlow rounded-full bg-neon" />
      <h1 className="mt-5 text-2xl font-black">در انتظار تأیید معلم</h1>
      <p className="mt-3 text-sm leading-7 text-muted">
        معلم واریز {toman(t.amount)} را در برنامه‌ی بانکش بررسی و تأیید می‌کند. می‌توانید این صفحه را ببندید؛ بعد از تأیید اعلان می‌گیرید.
      </p>
      <Link href="/portal" className="btn-ghost mt-6">بازگشت به پروفایل</Link>
    </Spot>);

  return wrap(
    <Spot className="p-6 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted">مبلغ قابل پرداخت</p>
          <h1 className="glow mt-1 text-3xl font-black">{toman(t.amount)}</h1>
        </div>
        <Ring value={expired ? 0 : left / total} size={84} stroke={8}>
          <span className={`text-sm font-black tabular-nums ${left < 60000 && !expired ? "text-rose" : ""}`} dir="ltr">{mm}:{ss}</span>
        </Ring>
      </div>

      {expired ? (
        <div className="mt-6 rounded-2xl border border-rose/30 bg-rose/10 p-6 text-center">
          <p className="font-bold text-rose">زمان این صفحه تمام شد</p>
          <p className="mt-1 text-sm text-fg/70">برای جلوگیری از اشتباه، این صفحه غیرفعال شد. اگر هنوز واریز نکرده‌اید، دوباره شروع کنید.</p>
          <button onClick={restart} className="btn-primary mt-4">شروع دوباره</button>
        </div>
      ) : (
        <>
          <div className="mt-6 space-y-3">
            <CopyRow label="شماره کارت مقصد" value={t.card} shown={spaced(t.card)} />
            {t.holder && <p className="px-1 text-sm text-muted">به نام: <span className="font-bold text-fg">{t.holder}</span></p>}
            <CopyRow label="مبلغ (تومان)" value={String(t.amount)} shown={n(t.amount)} />
          </div>

          <ol className="mt-6 list-decimal space-y-1.5 ps-5 text-sm leading-7 text-fg/80">
            <li>شماره کارت و مبلغ را کپی کنید.</li>
            <li>در برنامه‌ی بانک خودتان کارت‌به‌کارت کنید.</li>
            <li>بعد از موفق‌شدن، همین‌جا اطلاعات را وارد کنید و «پرداخت کردم» را بزنید.</li>
          </ol>

          <form onSubmit={submit} className="mt-6 space-y-4 border-t border-line pt-6">
            <div>
              <label className="label" htmlFor="receipt">عکس رسید واریز</label>
              <input
                id="receipt" required type="file" accept="image/png,image/jpeg,image/webp"
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                className="input cursor-pointer file:ml-3 file:rounded-md file:border-0 file:bg-neon/15 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-neon"
              />
              {preview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="پیش‌نمایش رسید" className="mt-3 h-40 w-full rounded-xl border border-line object-cover" />
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="l4">۴ رقم آخر کارتی که از آن واریز کردید</label>
                <input id="l4" required inputMode="numeric" maxLength={4} dir="ltr" className="input tracking-[0.4em]" value={last4} onChange={(e) => setLast4(e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="tr">شماره پیگیری (اختیاری)</label>
                <input id="tr" inputMode="numeric" dir="ltr" className="input" value={tracking} onChange={(e) => setTracking(e.target.value)} />
              </div>
            </div>
            <p className="rounded-lg bg-amber/10 px-3 py-2 text-xs leading-6 text-amber">
              شماره کامل کارت، CVV2 و رمز دوم را هرگز اینجا وارد نکنید؛ فقط در برنامه‌ی خود بانک.
            </p>
            {err && <p role="alert" className="text-sm text-rose">{err}</p>}
            <button disabled={busy || last4.length < 4} className="btn-primary w-full py-3">{busy ? "لطفاً صبر کنید…" : "پرداخت کردم"}</button>
          </form>
        </>
      )}
    </Spot>);
}
