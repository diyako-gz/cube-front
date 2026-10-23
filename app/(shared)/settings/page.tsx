"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useMe } from "@/components/Shell";
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
  const me = useMe();
  const [hrs, setHrs] = useState<{ start: number; end: number; days: number[] } | null>(null);
  const [card, setCard] = useState("");
  const [holder, setHolder] = useState("");
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

  // ---- Working hours (teacher): used to suggest free times for makeup sessions ----
  useEffect(() => { if (info?.hours && !hrs) setHrs(info.hours); }, [info, hrs]);
  const saveHours = () => wrap("hours", async () => {
    if (hrs) await api("/settings/hours", { method: "PUT", body: hrs });
    await load();
  });

  // ---- Card for card-to-card payments (teacher) ----
  const saveCard = (remove: boolean) => wrap("card", async () => {
    if (remove && !confirm("دکمه‌ی پرداخت کارت‌به‌کارت برای زبان‌آموزانتان غیرفعال می‌شود. ادامه می‌دهید؟")) return;
    await api("/payment/card", { method: "PUT", body: { cardNumber: remove ? "" : card, holder: remove ? "" : holder } });
    setCard(""); setHolder("");
    await load();
  });

  // ---- Telegram ----
  const connectTelegram = () => wrap("tg", async () => {
    const { url } = await api<{ url: string }>("/telegram/link", { method: "POST" });
    window.open(url, "_blank", "noopener");
    // wait for the user to press Start in Telegram
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

  // ---- Push ----
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

  // ---- Calendar ----
  const makeCalendar = (reset: boolean) => wrap("cal", async () => {
    if (reset && !confirm("لینک قبلی از کار می‌افتد و باید لینک جدید را دوباره به تقویم اضافه کنید. ادامه می‌دهید؟")) return;
    await api("/calendar/token", { method: "POST", body: { reset } });
    await load();
  });
  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked */ }
  };

  if (!info) return <p className="text-muted">{err || "در حال بارگذاری…"}</p>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="h-page text-4xl">تنظیمات</h1>
        <p className="mt-2 text-sm text-muted">یادآوری‌ها را کجا می‌خواهید دریافت کنید؟</p>
      </header>
      {err && <p role="alert" className="rounded-lg border border-rose/30 bg-rose/10 px-3 py-2 text-sm text-rose">{err}</p>}

      {me.role === "teacher" && hrs && (
        <Section title="ساعت‌های کاری" hint="سایت فقط در این ساعت‌ها و روزها زمان خالی برای جلسه‌ی جبرانی پیشنهاد می‌دهد.">
          <div className="grid grid-cols-2 gap-4 sm:max-w-sm">
            {(["start", "end"] as const).map((k) => (
              <div key={k}>
                <label className="label" htmlFor={`h-${k}`}>{k === "start" ? "از ساعت" : "تا ساعت"}</label>
                <select id={`h-${k}`} className="input" value={hrs[k]} onChange={(e) => setHrs({ ...hrs, [k]: Number(e.target.value) })}>
                  {Array.from({ length: 49 }, (_, i) => i * 30).filter((m) => (k === "start" ? m < 1440 : m > 0)).map((m) => (
                    <option key={m} value={m}>{`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)])}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-4 gap-1.5 sm:grid-cols-7">
            {[[6, "شنبه"], [0, "یکشنبه"], [1, "دوشنبه"], [2, "سه‌شنبه"], [3, "چهارشنبه"], [4, "پنجشنبه"], [5, "جمعه"]].map(([d, l]) => {
              const on = hrs.days.includes(d as number);
              return (
                <button
                  key={d} type="button" aria-pressed={on}
                  onClick={() => setHrs({ ...hrs, days: on ? hrs.days.filter((x) => x !== d) : [...hrs.days, d as number] })}
                  className={`rounded-lg border px-1 py-2 text-xs transition-all duration-300 ${on ? "border-neon/60 bg-neon/10 font-bold text-neon" : "border-line bg-panel/50 text-fg/65 hover:border-neon/30"}`}
                >
                  {l}
                </button>
              );
            })}
          </div>
          <button disabled={busy === "hours" || hrs.days.length === 0 || hrs.end - hrs.start < 30} onClick={saveHours} className="btn-primary btn-sm mt-4">ذخیره</button>
        </Section>
      )}

      {me.role === "teacher" && info.card && (
        <Section
          title="کارت دریافت شهریه"
          hint="وقتی زبان‌آموز «پرداخت کارت‌به‌کارت» را می‌زند، شماره این کارت و مبلغ را با یک تایمر می‌بیند. بعد از واریز، شما در برنامه‌ی بانک‌تان می‌بینید و با یک کلیک تأیید می‌کنید."
        >
          {info.card.configured && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-lime">
                <span className="h-2 w-2 rounded-full bg-lime" /> فعال، کارت <span dir="ltr">{info.card.masked}</span>
                {info.card.holder && <span className="text-muted">({info.card.holder})</span>}
              </span>
              <button disabled={busy === "card"} onClick={() => saveCard(true)} className="btn-danger btn-sm">حذف</button>
            </div>
          )}
          <form onSubmit={(e) => { e.preventDefault(); saveCard(false); }} className="space-y-3">
            <div>
              <label className="label" htmlFor="card">{info.card.configured ? "تغییر شماره کارت" : "شماره کارت (۱۶ رقم)"}</label>
              <input id="card" required inputMode="numeric" dir="ltr" className="input tracking-widest" placeholder="6037 9912 3456 7890" value={card} onChange={(e) => setCard(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="holder">نام صاحب کارت (اختیاری، برای اطمینان زبان‌آموز)</label>
              <input id="holder" className="input" value={holder} onChange={(e) => setHolder(e.target.value)} />
            </div>
            <button disabled={busy === "card" || !card.trim()} className="btn-primary btn-sm">ذخیره</button>
          </form>
          <p className="mt-4 text-xs leading-6 text-muted">
            فقط شماره کارت خودتان را وارد کنید (نه رمز یا CVV2). ارقام کارت هنگام ذخیره بررسی می‌شوند و اگر اشتباه باشند خطا می‌گیرید.
          </p>
        </Section>
      )}

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

      <Section title="نصب به‌عنوان اپ" hint="دفتر کلاس را مثل یک برنامه روی صفحه‌ی اصلی داشته باشید.">
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
