"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api, tokenStore } from "@/lib/api";
import { dateTimeFa, n } from "@/lib/format";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { AppNotification, Me, Role } from "@/lib/types";
import { createPortal } from "react-dom";

const MeCtx = createContext<Me | null>(null);
export const useMe = () => {
  const m = useContext(MeCtx);
  if (!m) throw new Error("useMe must be used inside Shell");
  return m;
};

const NAV = [
  { href: "/dashboard", label: "داشبورد" },
  { href: "/students", label: "زبان‌آموزان" },
  { href: "/schedule", label: "برنامه‌ی کلاس‌ها" },
  { href: "/income", label: "درآمد" },
];

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[18px] w-[18px]"
      aria-hidden
    >
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[18px] w-[18px]"
      aria-hidden
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  );
}

function Bell() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      if (!bellRef.current) return;

      const rect = bellRef.current.getBoundingClientRect();
      const isMobile = window.innerWidth < 640;

      if (isMobile) {
        setPanelStyle({
          position: "fixed",
          top: "5rem",
          right: "0.75rem",
        });
        return;
      }

      const panelWidth = Math.min(320, window.innerWidth - 24);

      setPanelStyle({
        position: "fixed",
        top: `${rect.bottom + 10}px`,
        left: `${Math.max(
          12,
          Math.min(
            rect.right - panelWidth + 20,
            window.innerWidth - panelWidth - 12,
          ),
        )}px`,
      });
    };

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  const load = useCallback(() => {
    api<{ items: AppNotification[]; unread: number }>("/notifications")
      .then((r) => {
        setItems(r.items ?? []);
        setUnread(r.unread ?? 0);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setMounted(true);
    load();

    const timer = setInterval(load, 60_000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const toggle = () => {
    const next = !open;
    setOpen(next);

    if (next && unread > 0) {
      api("/notifications/read", { method: "POST" })
        .then(() => setUnread(0))
        .catch(() => {});
    }
  };

  return (
    <>
      <div ref={bellRef} className="shrink-0">
        <button
          type="button"
          onClick={toggle}
          className="btn-ghost btn-sm whitespace-nowrap"
          aria-label="اعلان‌ها"
          aria-expanded={open}
          aria-haspopup="dialog"
        >
          <BellIcon />

          <span className="hidden sm:inline">اعلان‌ها</span>

          {unread > 0 && (
            <span
              className="animate-pulseGlow rounded-full bg-pink px-1.5 text-[11px] leading-5 text-white"
              style={{ boxShadow: "0 0 10px rgb(var(--pink))" }}
            >
              {n(unread)}
            </span>
          )}
        </button>
      </div>

      {mounted &&
        open &&
        createPortal(
          <>
            <button
              type="button"
              className="fixed inset-0 z-[9998] cursor-default"
              onClick={() => setOpen(false)}
              aria-label="بستن اعلان‌ها"
              tabIndex={-1}
            />

            <section
              role="dialog"
              aria-label="اعلان‌ها"
              className="
  z-[9999]
  flex max-h-[calc(100dvh-6rem)] w-80
  max-w-[calc(100vw-1.5rem)] flex-col
  overflow-hidden rounded-2xl border border-line
  bg-panel shadow-2xl
"
              style={panelStyle}
            >
              <div className="flex shrink-0 items-center justify-between border-b border-line bg-panel px-4 py-3">
                <span className="text-sm font-bold">اعلان‌ها</span>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-xl leading-none text-muted hover:text-neon"
                  aria-label="بستن"
                >
                  ×
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                {items.length === 0 ? (
                  <p className="p-4 text-sm leading-7 text-muted">
                    هنوز اعلانی نیست. یادآوری جلسه‌ها و شهریه اینجا نمایش داده
                    می‌شود.
                  </p>
                ) : (
                  <ul className="divide-y divide-line">
                    {items.map((it) => (
                      <li key={it.id} className="p-4">
                        <p className="text-sm font-medium text-neon">
                          {it.title}
                        </p>

                        <p className="mt-1 text-sm leading-7 text-fg/80">
                          {it.body}
                        </p>

                        <p className="mt-2 text-xs text-muted">
                          {dateTimeFa(it.createdAt)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {items.length > 0 && (
                <div className="shrink-0 border-t border-line px-4 py-2">
                  <p className="text-center text-xs text-muted">
                    {n(items.length)} اعلان
                  </p>
                </div>
              )}
            </section>
          </>,
          document.body,
        )}
    </>
  );
}

export function Shell({
  role,
  children,
}: {
  role: Role | "any";
  children: React.ReactNode;
}) {
  const router = useRouter();
  const path = usePathname();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    if (!tokenStore.get()) {
      router.replace("/login");
      return;
    }
    api<Me>("/me")
      .then((m) => {
        if (role !== "any" && m.role !== role)
          router.replace(m.role === "teacher" ? "/dashboard" : "/portal");
        else setMe(m);
      })
      .catch(() => {
        tokenStore.clear();
        router.replace("/login");
      });
  }, [role, router]);

  if (!me) {
    return (
      <div className="grid min-h-screen place-items-center">
        <span
          className="h-3 w-3 animate-pulseGlow rounded-full bg-neon"
          aria-label="در حال بارگذاری"
        />
      </div>
    );
  }

  const logout = () => {
    tokenStore.clear();
    router.replace("/login");
  };
  const isTeacher = me.role === "teacher";
  const idx = NAV.findIndex((l) => path.startsWith(l.href));

  return (
    <MeCtx.Provider value={me}>
      <header className="app-header fixed inset-x-0 top-0 z-40 px-4 pb-3 pt-4 sm:px-6">
        {/* header background: frosted glass + neon hairline */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 border-b border-line bg-bg/70 backdrop-blur-xl"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 -z-10 h-px bg-gradient-to-l from-transparent via-neon/60 to-transparent"
        />

        <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-3">
          <Link
            href={isTeacher ? "/dashboard" : "/portal"}
            className="group flex items-center gap-2.5 justify-self-start"
          >
            <img
              src="/icons/cube-mark.svg"
              alt="CUBE"
              width={36}
              height={36}
              className="cube-logo-mark h-9 w-9 transition-transform duration-500 group-hover:rotate-12"
            />
            <span className="hidden text-lg font-black tracking-tight sm:block">
              CUBE
            </span>
          </Link>

          {isTeacher ? (
            <nav
              aria-label="منوی اصلی"
              className="fixed inset-x-4 bottom-4 z-40 sm:static sm:inset-auto"
            >
              <div className="glass relative mx-auto grid max-w-sm grid-cols-4 rounded-full bg-panel/70 p-1 shadow-[0_10px_40px_-10px_rgb(var(--shadow)/.5)] sm:w-[30rem] sm:max-w-none">
                <span
                  aria-hidden
                  className="absolute inset-y-1 right-1 rounded-full bg-gradient-to-l from-neon/25 to-violet/25 shadow-[0_0_22px_rgb(var(--neon)/.35)] ring-1 ring-neon/40 transition-transform duration-500 ease-[cubic-bezier(.3,1.3,.5,1)]"
                  style={{
                    width: "calc((100% - .5rem) / 4)",
                    transform: `translateX(${-Math.max(idx, 0) * 100}%)`,
                    opacity: idx < 0 ? 0 : 1,
                  }}
                />
                {NAV.map((l, i) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`relative z-10 whitespace-nowrap rounded-full px-1 py-2.5 text-center text-xs transition-colors duration-300 sm:text-sm ${i === idx ? "font-bold text-neon" : "text-fg/65 hover:text-fg"}`}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </nav>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2 justify-self-end">
            <span className="hidden text-sm text-muted md:inline">
              {me.name}
            </span>
            <ThemeToggle />
            <Link
              href="/settings"
              className="btn-ghost btn-sm"
              aria-label="تنظیمات"
            >
              <GearIcon />
              <span className="hidden sm:inline">تنظیمات</span>
            </Link>
            <Bell />
            <button onClick={logout} className="btn-ghost btn-sm">
              خروج
            </button>
          </div>
        </div>
      </header>

      {/* key = route → entrance animation replays on every page change */}
      <main
        key={path}
        className="page mx-auto max-w-7xl px-4 pb-32 pt-24 sm:px-6 sm:pb-20 sm:pt-28"
      >
        {children}
      </main>
    </MeCtx.Provider>
  );
}
