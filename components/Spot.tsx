"use client";
import Link from "next/link";


export function Spot({ href, className = "", children }: { href?: string; className?: string; children: React.ReactNode }) {
  const move = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return href ? (
    <Link href={href} onMouseMove={move} className={`spot ${className}`}>{children}</Link>
  ) : (
    <div onMouseMove={move} className={`spot ${className}`}>{children}</div>
  );
}
