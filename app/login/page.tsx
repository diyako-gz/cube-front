"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, tokenStore } from "@/lib/api";
import { Beads } from "@/components/Beads";
import { Spot } from "@/components/Spot";
import { StatusBadge } from "@/components/StatusBadge";
import { Tabs } from "@/components/Tabs";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { AuthConfig, Me } from "@/lib/types";

type Mode = "login" | "register" | "forgot" | "reset";

// ---------- rotating feature showcase (desktop) ----------
const DURATION = 4800;
const WEEK_DEMO: [string, number][] = [
  ["ش", 2],
  ["ی", 0],
  ["د", 1],
  ["س", 2],
  ["چ", 0],
  ["پ", 1],
  ["ج", 0],
];

const FEATURES: { title: string; text: string; visual: React.ReactNode }[] = [
  {
    title: "یادآوری در تلگرام",
    text: "جلسه و شهریه خودکار به معلم و زبان‌آموز یادآوری می‌شود؛ بدون اینکه کسی سایت را باز کند.",
    visual: (
      <div className="space-y-2">
        <div className="w-fit max-w-[90%] rounded-2xl rounded-ss-md bg-neon/15 px-4 py-2.5 text-sm">
          🔔 یادآوری: جلسه‌ی فردا ساعت ۱۸:۰۰
        </div>
        <div className="w-fit max-w-[90%] rounded-2xl rounded-ss-md border border-line bg-panel/60 px-4 py-2.5 text-sm text-fg/80">
          شهریه‌ی شما ۳ روز دیگر سررسید می‌شود.
        </div>
      </div>
    ),
  },
  {
    title: "جلسه‌ها خودکار کم می‌شوند",
    text: "با هر «برگزار شد»، یک مهره روشن می‌شود و یک جلسه از بسته کم می‌شود. حساب‌وکتاب دستی لازم نیست.",
    visual: (
      <div className="flex flex-col items-start gap-3">
        <Beads total={8} left={3} size="lg" />
        <span className="text-sm text-muted">۳ جلسه مانده از ۸ جلسه</span>
      </div>
    ),
  },
  {
    title: "پرداخت و رسید",
    text: "وضعیت شهریه هر زبان‌آموز مشخص است و برای هر پرداخت یک رسید قابل چاپ و ذخیره به‌صورت PDF ساخته می‌شود.",
    visual: (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">رسید پرداخت شهریه</span>
          <StatusBadge status="paid" />
        </div>
        <p className="text-2xl font-black">۱٬۲۰۰٬۰۰۰ تومان</p>
      </div>
    ),
  },
  {
    title: "کلاس‌ها در تقویم گوشی",
    text: "یک لینک خصوصی بگیرید تا کلاس‌ها در گوگل‌کلندر یا تقویم گوشی هم دیده شوند و خودشان به‌روز شوند.",
    visual: (
      <div className="grid grid-cols-7 gap-1.5">
        {WEEK_DEMO.map(([d, n], i) => (
          <div
            key={i}
            className={`flex flex-col items-center gap-1.5 rounded-xl border py-2.5 ${i === 3 ? "border-neon/60 bg-neon/10" : "border-line bg-panel/50"}`}
          >
            <span className="text-xs text-muted">{d}</span>
            <span className="flex h-1.5 gap-0.5">
              {Array.from({ length: n }, (_, k) => (
                <span key={k} className="h-1.5 w-1.5 rounded-full bg-violet" />
              ))}
            </span>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "یادداشت و تکلیف",
    text: "بعد از هر کلاس، درس، تکلیف و نقاط ضعف را بنویسید؛ زبان‌آموز همه را در پروفایل خودش می‌بیند.",
    visual: (
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="label">تکلیف</dt>
          <dd>تمرین صفحه‌ی ۴۲ و ۱۰ لغت جدید</dd>
        </div>
        <div>
          <dt className="label">نکته</dt>
          <dd>تلفظ حرف th را بیشتر تمرین کن</dd>
        </div>
      </dl>
    ),
  },
];

function FeatureShowcase() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [epoch, setEpoch] = useState(0); // restarts the progress bar after a pause
  const [still, setStill] = useState(false);

  useEffect(() => {
    setStill(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  useEffect(() => {
    if (paused || still) return;
    const t = setTimeout(
      () => setI((x) => (x + 1) % FEATURES.length),
      DURATION,
    );
    return () => clearTimeout(t);
  }, [i, paused, still, epoch]);

  const f = FEATURES[i];
  return (
    <div
      className="mt-10 hidden max-w-md lg:block"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false);
        setEpoch((e) => e + 1);
      }}
    >
      <Spot className="p-6">
        <p className="text-xs text-muted">چه امکاناتی دارد؟</p>
        <div
          key={i}
          className="animate-rise mt-4 min-h-[13.5rem]"
          aria-live="polite"
        >
          <div className="rounded-2xl border border-line bg-panel/50 p-4">
            {f.visual}
          </div>
          <h3 className="mt-5 text-lg font-black">{f.title}</h3>
          <p className="mt-1.5 text-sm leading-7 text-fg/70">{f.text}</p>
        </div>

        <div className="mt-5 flex gap-2" role="tablist" aria-label="ویژگی‌ها">
          {FEATURES.map((x, k) => (
            <button
              key={x.title}
              role="tab"
              aria-selected={k === i}
              aria-label={x.title}
              onClick={() => {
                setI(k);
                setEpoch((e) => e + 1);
              }}
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-fg/10 transition-colors hover:bg-fg/20"
            >
              {k === i && (
                <span
                  key={`${i}-${epoch}`}
                  className={`block h-full rounded-full bg-gradient-to-l from-neon to-violet ${paused || still ? "" : "growx"}`}
                  style={
                    paused || still
                      ? undefined
                      : {
                          animationDuration: `${DURATION}ms`,
                          animationTimingFunction: "linear",
                        }
                  }
                />
              )}
              {k < i && <span className="block h-full rounded-full bg-fg/30" />}
            </button>
          ))}
        </div>
      </Spot>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [cfg, setCfg] = useState<AuthConfig>({
    registration: "closed",
    passwordReset: false,
  });
  const [f, setF] = useState({
    name: "",
    username: "",
    password: "",
    inviteCode: "",
    code: "",
  });
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<AuthConfig>("/auth/config")
      .then(setCfg)
      .catch(() => {});
  }, []);

  const go = (m: Mode) => {
    setMode(m);
    setErr("");
    setInfo("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setInfo("");
    setBusy(true);
    try {
      if (mode === "forgot") {
        const r = await api<{ message: string }>("/auth/forgot", {
          method: "POST",
          body: { username: f.username },
        });
        setInfo(r.message);
        setMode("reset");
        return;
      }
      if (mode === "reset") {
        await api("/auth/reset", {
          method: "POST",
          body: { username: f.username, code: f.code, password: f.password },
        });
        setMode("login");
        setF({ ...f, password: "", code: "" });
        setInfo("رمز عبور عوض شد. حالا وارد شوید.");
        return;
      }
      const r = await api<{ token: string; user: Me }>(
        mode === "login" ? "/auth/login" : "/auth/register",
        {
          method: "POST",
          body:
            mode === "login"
              ? { username: f.username, password: f.password }
              : {
                  name: f.name,
                  username: f.username,
                  password: f.password,
                  inviteCode: f.inviteCode,
                },
        },
      );
      tokenStore.set(r.token);
      router.replace(r.user.role === "teacher" ? "/dashboard" : "/portal");
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "خطا");
    } finally {
      setBusy(false);
    }
  };

  const canRegister = cfg.registration !== "closed";
  const tabs = canRegister
    ? [
        { id: "login" as const, label: "ورود" },
        { id: "register" as const, label: "ساخت حساب معلم" },
      ]
    : null;
  const title =
    mode === "forgot"
      ? "بازیابی رمز عبور"
      : mode === "reset"
        ? "رمز جدید"
        : null;
  const submitLabel = {
    login: "ورود به دفتر",
    register: "ساخت حساب",
    forgot: "ارسال کد",
    reset: "تغییر رمز عبور",
  }[mode];

  return (
    <div className="flex min-h-[100dvh] flex-col cube-pattern">
      <header className="flex items-center justify-between px-5 pt-5 sm:px-8">
        <div className="flex items-center gap-2.5">
          <img
            src="/icons/cube-mark.svg"
            alt="CUBE"
            width={36}
            height={36}
            className="h-9 w-9"
          />
          <span className="text-lg font-black tracking-tight">CUBE</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-8 sm:px-8">
        <div className="grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <section className="animate-rise">
            <h1 className="h-page text-4xl leading-[1.3] sm:text-5xl lg:text-6xl">
              کلاس‌هایتان،
              <br />
              مرتب و روشن.
            </h1>
            <p className="mt-5 max-w-md leading-9 text-fg/70">
              شهریه، جلسه‌ها و درآمد ماهانه در یک دفتر. هر جلسه که برگزار
              می‌شود، یک مهره روشن می‌شود و یادآوری‌ها خودکار می‌روند.
            </p>
            <FeatureShowcase />
          </section>

          <section className="animate-rise" style={{ animationDelay: ".12s" }}>
            <div className="neon-border mx-auto w-full max-w-md">
              <form
                onSubmit={submit}
                className="space-y-5 rounded-[22px] bg-panel/90 p-6 backdrop-blur-xl sm:p-8"
              >
                {(mode === "login" || mode === "register") && tabs ? (
                  <Tabs<"login" | "register">
                    value={mode}
                    onChange={go}
                    items={tabs}
                  />
                ) : (
                  <h2 className="text-xl font-black">{title ?? "ورود"}</h2>
                )}

                {mode === "register" && (
                  <div className="animate-fade">
                    <label className="label" htmlFor="name">
                      نام شما
                    </label>
                    <input
                      id="name"
                      required
                      autoComplete="name"
                      className="input"
                      value={f.name}
                      onChange={(e) => setF({ ...f, name: e.target.value })}
                    />
                  </div>
                )}
                <div>
                  <label className="label" htmlFor="username">
                    نام کاربری
                  </label>
                  <input
                    id="username"
                    required
                    dir="ltr"
                    autoComplete="username"
                    className="input"
                    value={f.username}
                    onChange={(e) => setF({ ...f, username: e.target.value })}
                  />
                </div>

                {mode === "register" && cfg.registration === "invite" && (
                  <div className="animate-fade">
                    <label className="label" htmlFor="invite">
                      کد دعوت
                    </label>
                    <input
                      id="invite"
                      required
                      dir="ltr"
                      className="input"
                      value={f.inviteCode}
                      onChange={(e) =>
                        setF({ ...f, inviteCode: e.target.value })
                      }
                    />
                  </div>
                )}
                {mode === "reset" && (
                  <div className="animate-fade">
                    <label className="label" htmlFor="code">
                      کد ارسال‌شده در تلگرام
                    </label>
                    <input
                      id="code"
                      required
                      inputMode="numeric"
                      dir="ltr"
                      autoComplete="one-time-code"
                      className="input tracking-[0.3em]"
                      value={f.code}
                      onChange={(e) => setF({ ...f, code: e.target.value })}
                    />
                  </div>
                )}

                {mode !== "forgot" && (
                  <div>
                    <label className="label" htmlFor="password">
                      {mode === "reset" ? "رمز عبور جدید" : "رمز عبور"}
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        required
                        minLength={6}
                        dir="ltr"
                        type={show ? "text" : "password"}
                        autoComplete={
                          mode === "login" ? "current-password" : "new-password"
                        }
                        className="input pr-16"
                        value={f.password}
                        onChange={(e) =>
                          setF({ ...f, password: e.target.value })
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setShow((s) => !s)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs text-muted transition-colors hover:text-neon"
                      >
                        {show ? "پنهان" : "نمایش"}
                      </button>
                    </div>
                  </div>
                )}

                {info && (
                  <p
                    role="status"
                    className="animate-fade rounded-lg border border-lime/30 bg-lime/10 px-3 py-2 text-sm text-lime"
                  >
                    {info}
                  </p>
                )}
                {err && (
                  <p
                    role="alert"
                    className="animate-fade rounded-lg border border-rose/30 bg-rose/10 px-3 py-2 text-sm text-rose"
                  >
                    {err}
                  </p>
                )}

                <button disabled={busy} className="btn-primary w-full py-3">
                  {busy && (
                    <span className="h-2 w-2 animate-pulseGlow rounded-full bg-onaccent" />
                  )}
                  {busy ? "لطفاً صبر کنید…" : submitLabel}
                </button>

                {mode === "login" && (
                  <div className="space-y-2 text-center text-xs leading-6 text-muted">
                    {mode === "login" && (
                      <div className="space-y-2 text-center text-xs leading-6 text-muted">
                        <button
                          type="button"
                          onClick={() => go("forgot")}
                          className="text-neon transition-colors hover:underline"
                        >
                          رمز عبور را فراموش کرده‌اید؟
                        </button>
                      </div>
                    )}
                    <p>
                      زبان‌آموزان با نام کاربری و رمزی که معلم برایشان ساخته
                      وارد می‌شوند.
                    </p>
                  </div>
                )}
                {(mode === "forgot" || mode === "reset") && (
                  <div className="space-y-2 text-center text-xs leading-6 text-muted">
                    {mode === "forgot" && (
                      <p>
                        کد از طریق ربات تلگرامی که به حسابتان وصل کرده‌اید
                        فرستاده می‌شود.
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => go("login")}
                      className="text-neon hover:underline"
                    >
                      بازگشت به ورود
                    </button>
                  </div>
                )}
              </form>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
