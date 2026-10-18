"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { Spot } from "@/components/Spot";
import type { SettingsInfo } from "@/lib/types";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

function b64ToBytes(b64: string): Uint8Array {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <Spot className="p-6 sm:p-8">
      <h2 className="text-lg font-black">{title}</h2>
      {hint && <p className="mt-1 text-sm leading-7 text-muted">{hint}</p>}
      <div className="mt-5">{children}</div>
    </Spot>
  );
}

export default function SettingsPage() {
  const [info, setInfo] = useState<SettingsInfo | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");
  const [copied, setCopied] = useState(false);
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pushOn, setPushOn] = useState(false);
  const [pushSupported, setPushSupported] = useState(true);
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(() => api<SettingsInfo>("/settings").then(setInfo).catch((e: Error) => setErr(e.message)), []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => () => { if (poll.current) clearInterval(poll.current); }, []);

  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setPushSupported(supported);
    if (supported) {
      navigator.serviceWorker.ready.then((r) => r.pushManager.getSubscription()).then((s) => setPushOn(!!s)).catch(() => {});
    }
    const h = (e: Event) => { e.preventDefault(); setInstall(e as InstallEvent); };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);

  const wrap = async (key: string, fn: () => Promise<void>) => {
    setBusy(key); setErr("");
    try { await fn(); } catch (e) { setErr(e instanceof Error ? e.message : "خطا"); }
    finally { setBusy(""); }
  };


  const connectTelegram = () => wrap("tg", async () => {
    const { url } = await api<{ url: string }>("/telegram/link", { method: "POST" });
    window.open(url, "_blank", "noopener");

    if (poll.current) clearInterval(poll.current);
    let n = 0;
    poll.current = setInterval(async () => {
      n++;
      const s = await api<SettingsInfo>("/settings").catch(() => null);
      if (s) setInfo(s);
      if ((s && s.telegram.linked) || n > 40) { if (poll.current) clearInterval(poll.current); }
    }, 3000);
  });
  const sendTest = () => wrap("test", async () => {
    setTestMsg(null);
    const r = await api<{ telegram: string; error?: string }>("/notifications/test", { method: "POST" });
    if (r.telegram === "sent") setTestMsg({ ok: true, text: "پیام آزمایشی به تلگرام ارسال شد. اگر نرسید، چند ثانیه صبر کنید." });
    else if (r.telegram === "error") setTestMsg({ ok: false, text: `تلگرام پیام را نپذیرفت: ${r.error ?? "خطای نامشخص"}` });
    else setTestMsg({ ok: true, text: "اعلان داخل سایت (زنگ بالا) ساخته شد؛ تلگرام وصل نیست." });
  });
  const disconnectTelegram = () => wrap("tg", async () => { await api("/telegram/unlink", { method: "POST" }); await load(); });


  const enablePush = () => wrap("push", async () => {
    const perm = await Notification.requestPermission();
    if (perm !== "granted") throw new Error("اجازه‌ی اعلان داده نشد. از تنظیمات مرورگر آن را فعال کنید.");
    const reg = await navigator.serviceWorker.ready;
    const { key } = await api<{ key: string }>("/push/key");
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(key) as BufferSource });
    await api("/push/subscribe", { method: "POST", body: sub.toJSON() });
    setPushOn(true);
  });
  const disablePush = () => wrap("push", async () => {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await api("/push/unsubscribe", { method: "POST", body: { endpoint: sub.endpoint } });
      await sub.unsubscribe();
    }
    setPushOn(false);
  });


  const makeCalendar = (reset: boolean) => wrap("cal", async () => {
    if (reset && !confirm("لینک قبلی از کار می‌افتد و باید لینک جدید را دوباره به تقویم اضافه کنید. ادامه می‌دهید؟")) return;
    await api("/calendar/token", { method: "POST", body: { reset } });
    await load();
  });
  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { setErr("کپی نشد؛ مرورگر اجازه نداد."); }
  };

  if (!info) return <p className="text-muted">{err || "در حال بارگذاری…"}</p>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="h-page text-4xl">تنظیمات</h1>
        <p className="mt-2 text-sm text-muted">یادآوری‌ها را کجا می‌خواهید دریافت کنید؟</p>
      </header>
      {err && <p role="alert" className="rounded-lg border border-rose/30 bg-rose/10 px-3 py-2 text-sm text-rose">{err}</p>}

      <Section title="ربات تلگرام" hint="یادآوری جلسه‌ها، شهریه و پاسخ درخواست‌ها را در تلگرام دریافت کنید.">
        {!info.telegram.enabled ? (
          <p className="text-sm text-muted">ربات هنوز روی سرور تنظیم نشده است (متغیر <span dir="ltr">TELEGRAM_BOT_TOKEN</span>).</p>
        ) : info.telegram.linked ? (
          <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-lime"><span className="h-2 w-2 rounded-full bg-lime" /> متصل است</span>
            <div className="flex flex-wrap gap-2">
              <button disabled={busy === "test"} onClick={sendTest} className="btn-primary btn-sm">ارسال پیام آزمایشی</button>
              <button disabled={busy === "tg"} onClick={disconnectTelegram} className="btn-danger btn-sm">قطع اتصال</button>
            </div>
          </div>
          {testMsg && (
            <p role="status" className={`mt-3 rounded-lg border px-3 py-2 text-sm ${testMsg.ok ? "border-lime/30 bg-lime/10 text-lime" : "border-rose/30 bg-rose/10 text-rose"}`}>{testMsg.text}</p>
          )}
          </>
        ) : (
          <div className="space-y-3">
            <button disabled={busy === "tg"} onClick={connectTelegram} className="btn-primary">اتصال به تلگرام</button>
            <p className="text-xs leading-6 text-muted">تلگرام باز می‌شود؛ روی «Start» بزنید. این صفحه خودش وصل‌شدن را تشخیص می‌دهد.</p>
          </div>
        )}
      </Section>

      <Section title="اعلان روی این دستگاه" hint="حتی وقتی سایت بسته است، یادآوری‌ها به‌صورت اعلان روی همین گوشی یا رایانه می‌آیند.">
        {!pushSupported ? (
          <p className="text-sm text-muted">این مرورگر از اعلان پوش پشتیبانی نمی‌کند. روی آیفون ابتدا سایت را به صفحه‌ی اصلی اضافه کنید و از همان‌جا باز کنید.</p>
        ) : !info.push.enabled ? (
          <p className="text-sm text-muted">اعلان پوش روی سرور فعال نیست.</p>
        ) : pushOn ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-lime"><span className="h-2 w-2 rounded-full bg-lime" /> روی این دستگاه فعال است</span>
            <button disabled={busy === "push"} onClick={disablePush} className="btn-danger btn-sm">غیرفعال‌سازی</button>
          </div>
        ) : (
          <button disabled={busy === "push"} onClick={enablePush} className="btn-primary">فعال‌سازی اعلان</button>
        )}
      </Section>

      <Section title="تقویم گوشی و گوگل‌کلندر" hint="کلاس‌هایتان در تقویم هم دیده می‌شوند و خودشان به‌روز می‌شوند. این لینک خصوصی است؛ آن را به کسی ندهید.">
        {info.calendar.url ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input readOnly dir="ltr" className="input text-xs" value={info.calendar.url} onFocus={(e) => e.currentTarget.select()} />
              <button onClick={() => copy(info.calendar.url)} className="btn-ghost shrink-0">{copied ? "کپی شد" : "کپی"}</button>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={info.calendar.webcal} className="btn-primary btn-sm">افزودن به تقویم گوشی</a>
              <button disabled={busy === "cal"} onClick={() => makeCalendar(true)} className="btn-ghost btn-sm">ساخت لینک جدید</button>
            </div>
            <p className="text-xs leading-6 text-muted">
              در گوگل‌کلندر: Other calendars ← From URL، و لینک بالا را بچسبانید. گوگل معمولاً هر چند ساعت یک‌بار تقویم را به‌روز می‌کند.
            </p>
          </div>
        ) : (
          <button disabled={busy === "cal"} onClick={() => makeCalendar(false)} className="btn-primary">ساخت لینک تقویم</button>
        )}
      </Section>

      <Section title="نصب به‌عنوان اپ" hint="CUBE را مثل یک برنامه روی صفحه‌ی اصلی داشته باشید.">
        {install ? (
          <button onClick={() => install.prompt()} className="btn-primary">نصب برنامه</button>
        ) : (
          <p className="text-sm leading-7 text-muted">
            اندروید (کروم): منوی ⋮ ← Install app. آیفون (سافاری): دکمه‌ی Share ← Add to Home Screen. رایانه: آیکن نصب در نوار آدرس.
          </p>
        )}
      </Section>
    </div>
  );
}
