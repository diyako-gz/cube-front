"use client";
import { useEffect, useState } from "react";
import { receiptURL, tokenStore } from "@/lib/api";

/** Loads a receipt image that requires the login token, with a click-to-enlarge view. */
export function ReceiptImage({ transferId, className = "" }: { transferId: string; className?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let blobURL: string | null = null;
    const token = tokenStore.get();
    fetch(receiptURL(transferId), { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => (r.ok ? r.blob() : Promise.reject()))
      .then((b) => { blobURL = URL.createObjectURL(b); setSrc(blobURL); })
      .catch(() => {});
    return () => { if (blobURL) URL.revokeObjectURL(blobURL); };
  }, [transferId]);

  if (!src) return <div className={`grid place-items-center rounded-xl border border-line bg-panel/50 text-xs text-muted ${className}`}>در حال بارگذاری عکس…</div>;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`block overflow-hidden rounded-xl border border-line ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="عکس رسید واریز" className="h-full w-full object-cover" />
      </button>
      {open && (
        <div className="animate-fade fixed inset-0 z-[100] grid place-items-center bg-black/80 p-4" onClick={() => setOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="عکس رسید واریز" className="max-h-[90vh] max-w-full animate-pop rounded-xl" />
        </div>
      )}
    </>
  );
}
