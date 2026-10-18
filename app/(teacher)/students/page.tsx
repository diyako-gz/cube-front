"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { n, toman } from "@/lib/format";
import { Beads } from "@/components/Beads";
import { Modal } from "@/components/Modal";
import { Ring } from "@/components/Ring";
import { Spot } from "@/components/Spot";
import { StatusBadge } from "@/components/StatusBadge";
import { StudentForm } from "@/components/StudentForm";
import type { Student, StudentsPage } from "@/lib/types";

type Filter = "all" | "pay" | "low";
const PAGE_SIZE = 12;

function dueText(s: Student) {
  if (!s.nextDueAt || s.daysToDue === null) return "هنوز پرداخت نشده";
  return s.daysToDue >= 0 ? `${n(s.daysToDue)} روز تا سررسید` : `${n(-s.daysToDue)} روز از سررسید گذشته`;
}

export default function StudentsPage() {
  const [data, setData] = useState<StudentsPage | null>(null);
  const [err, setErr] = useState("");
  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);

  // search runs on the server; wait until the user pauses typing
  useEffect(() => {
    const t = setTimeout(() => { setDebounced(q.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(() => {
    const qs = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), filter, q: debounced });
    api<StudentsPage>(`/students?${qs}`).then((d) => { setData(d); setErr(""); }).catch((e: Error) => setErr(e.message));
  }, [page, filter, debounced]);
  useEffect(load, [load]);

  const chips: { id: Filter; label: string }[] = [
    { id: "all", label: "همه" }, { id: "pay", label: "نیازمند پرداخت" }, { id: "low", label: "رو به اتمام" },
  ];
  const empty = data && data.counts.all === 0;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="h-page text-4xl">زبان‌آموزان</h1>
          <p className="mt-2 text-sm text-muted">{data ? `${n(data.counts.all)} نفر در دفتر شما` : ""}</p>
        </div>
        <button className="btn-primary" onClick={() => setAdding(true)}>زبان‌آموز جدید</button>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {chips.map((c) => (
            <button
              key={c.id} onClick={() => { setFilter(c.id); setPage(1); }}
              className={`rounded-full border px-4 py-1.5 text-sm transition-all duration-300 ${
                filter === c.id ? "border-neon/60 bg-neon/10 text-neon shadow-[0_0_20px_-4px_rgb(var(--neon)/.55)]" : "border-line bg-panel/50 text-fg/65 hover:border-neon/30"
              }`}
            >
              {c.label} <span className="text-xs opacity-70">{data ? n(data.counts[c.id]) : ""}</span>
            </button>
          ))}
        </div>
        <input className="input w-full sm:w-64" placeholder="جستجوی نام یا زبان" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {err && <p className="text-rose">{err}</p>}
      {!data && !err && <p className="text-muted">در حال بارگذاری…</p>}

      {empty && (
        <Spot className="px-6 py-16 text-center">
          <p className="text-lg font-bold">هنوز زبان‌آموزی ثبت نشده است</p>
          <p className="mt-2 text-sm text-muted">با افزودن اولین زبان‌آموز، CUBEتان شروع می‌شود.</p>
          <button className="btn-primary mt-6" onClick={() => setAdding(true)}>زبان‌آموز جدید</button>
        </Spot>
      )}
      {data && !empty && data.items.length === 0 && <p className="py-10 text-center text-sm text-muted">موردی با این فیلتر پیدا نشد.</p>}

      {data && data.items.length > 0 && (
        <ul key={`${filter}-${debounced}-${data.page}`} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((s) => (
            <li key={s.id}>
              <Spot href={`/students/${s.id}`} className="spot-lift block p-6">
                <div className="flex items-center gap-4">
                  <Ring value={s.sessionsTotal ? s.sessionsHeld / s.sessionsTotal : 0} size={72} stroke={7}>
                    <span className="text-xl font-black">{n(s.sessionsLeft)}</span>
                  </Ring>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-bold">{s.name}</p>
                    <p className="mt-0.5 text-xs text-muted">{s.language || "بدون عنوان درس"}</p>
                  </div>
                </div>
                <div className="mt-5"><Beads total={s.sessionsTotal} left={s.sessionsLeft} /></div>
                <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                  <StatusBadge status={s.paymentStatus} />
                  <span className="text-xs text-muted">{dueText(s)}</span>
                </div>
                <p className="mt-2 text-xs text-fg/50">{toman(s.price)} برای {n(s.packageSessions)} جلسه</p>
              </Spot>
            </li>
          ))}
        </ul>
      )}

      {data && data.pages > 1 && (
        <nav aria-label="صفحه‌بندی" className="flex items-center justify-center gap-4 pt-2">
          <button className="btn-ghost btn-sm" disabled={data.page <= 1} onClick={() => setPage(data.page - 1)}>قبلی</button>
          <span className="text-sm text-muted">صفحه‌ی {n(data.page)} از {n(data.pages)}</span>
          <button className="btn-ghost btn-sm" disabled={data.page >= data.pages} onClick={() => setPage(data.page + 1)}>بعدی</button>
        </nav>
      )}

      {adding && (
        <Modal title="زبان‌آموز جدید" onClose={() => setAdding(false)}>
          <StudentForm onDone={() => { setAdding(false); load(); }} />
        </Modal>
      )}
    </div>
  );
}
