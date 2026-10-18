"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";


export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);


  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  if (!mounted) return null;
  return createPortal(
    <div
      className="animate-fade fixed inset-0 z-[100] overflow-y-auto bg-black/65 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div className="mx-auto flex min-h-full items-center justify-center">
        <div className="neon-border animate-pop w-full max-w-lg" onMouseDown={(e) => e.stopPropagation()}>
          <div role="dialog" aria-modal="true" aria-label={title} className="rounded-[22px] bg-panel p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="glow text-lg font-bold">{title}</h2>
              <button onClick={onClose} className="text-2xl leading-none text-muted transition-colors hover:text-neon" aria-label="بستن">×</button>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
