"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { dateLongFa, n } from "@/lib/format";
import { RATINGS } from "@/components/FeedbackCards";
import { Spot } from "@/components/Spot";
import type { Session } from "@/lib/types";

interface Feed {
  items: Session[];
  summary: { good: number; ok: number; bad: number };
}

/** What students think of the classes (last 30 days). Renders nothing until someone has answered. */
export function FeedbackPanel() {
  const [showAllFeedback, setShowAllFeedback] = useState(false);
  const [d, setD] = useState<Feed | null>(null);
  useEffect(() => {
    api<Feed>("/feedback")
      .then(setD)
      .catch(() => {});
  }, []);
  if (!d || !d.items || d.items.length === 0) return null;

  return (
    <section>
      <h2 className="h-sec mb-3">نظر زبان‌آموزان (۳۰ روز اخیر)</h2>
      <Spot className="p-5 sm:p-6">
        <div className="grid grid-cols-3 gap-3 text-center">
          {RATINGS.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-line bg-panel/50 py-3"
            >
              <p className="text-2xl" aria-hidden>
                {r.face}
              </p>
              <p className="mt-1 text-xl font-black">{n(d.summary[r.id])}</p>
              <p className="text-xs text-muted">{r.label}</p>
            </div>
          ))}
        </div>
        <ul className="mt-5 divide-y divide-line">
          {d.items.slice(0, showAllFeedback ? d.items.length : 3).map((s) => {
            const r = RATINGS.find((x) => x.id === s.rating);
            return (
              <li key={s.id} className="py-3 text-sm leading-7">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-bold">{s.studentName}</span>
                  {r && (
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] ${r.on}`}
                    >
                      {r.label}
                    </span>
                  )}
                  <span className="text-xs text-muted">
                    {dateLongFa(s.startsAt)}
                  </span>
                </p>
                {s.feedbackText && (
                  <p className="mt-1 whitespace-pre-wrap break-words text-fg/80">
                    «{s.feedbackText}»
                  </p>
                )}
              </li>
            );
          })}
        </ul>
        {d.items.length > 3 && (
          <button
            type="button"
            onClick={() => setShowAllFeedback((prev) => !prev)}
            className="btn-ghost mt-3 w-full"
            aria-expanded={showAllFeedback}
          >
            {showAllFeedback
              ? "نمایش کمتر"
              : `نمایش ${n(d.items.length - 3)} نظر دیگر`}
          </button>
        )}
      </Spot>
    </section>
  );
}
