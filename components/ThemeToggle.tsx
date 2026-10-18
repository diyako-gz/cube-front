"use client";
import { useEffect, useState } from "react";

const KEY = "daftar_theme";

type VT = { ready: Promise<void> };
type DocVT = { startViewTransition?: (cb: () => void) => VT };

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(true);
  useEffect(() => { setDark(document.documentElement.classList.contains("dark")); }, []);

  const apply = (d: boolean) => {
    document.documentElement.classList.toggle("dark", d);
    try { localStorage.setItem(KEY, d ? "dark" : "light"); } catch { /* storage may be blocked */ }
    setDark(d);
  };

  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const next = !dark;
    const start = (document as unknown as DocVT).startViewTransition?.bind(document);
    if (!start || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const root = document.documentElement;
      root.classList.add("theme-switching");
      apply(next);
      setTimeout(() => root.classList.remove("theme-switching"), 500);
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    start(() => apply(next)).ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
        { duration: 750, easing: "cubic-bezier(.2,.7,.2,1)", pseudoElement: "::view-transition-new(root)" },
      );
    }).catch(() => {});
  };

  const icon = "absolute h-[18px] w-[18px] transition-all duration-500 ease-[cubic-bezier(.3,1.3,.5,1)]";
  return (
    <button
      onClick={toggle}
      aria-label={dark ? "تغییر به حالت روشن" : "تغییر به حالت تیره"}
      title={dark ? "حالت روشن" : "حالت تیره"}
      className={`relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-panel/60 text-fg transition-all duration-300 hover:border-neon/60 hover:text-neon hover:shadow-[0_0_16px_rgb(var(--neon)/.35)] ${className}`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        className={`${icon} ${dark ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0"}`} aria-hidden>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        className={`${icon} ${dark ? "-rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"}`} aria-hidden>
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    </button>
  );
}
