"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import type { Student } from "@/lib/types";

export function StudentForm({ initial, onDone }: { initial?: Student; onDone: () => void }) {
  const edit = !!initial;
  const [f, setF] = useState({
    name: initial?.name ?? "", username: initial?.username ?? "", password: "",
    phone: initial?.phone ?? "", language: initial?.language ?? "",
    notes: initial?.notes ?? "",
    packageSessions: String(initial?.packageSessions ?? 8),
    price: String(initial?.price ?? ""),
    cycleDays: String(initial?.cycleDays ?? 30),
    alreadyPaid: false,
  });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const up = (k: keyof typeof f, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    const body = {
      name: f.name, username: f.username, password: f.password, phone: f.phone, language: f.language, notes: f.notes,
      packageSessions: Number(f.packageSessions), price: Number(f.price || 0), cycleDays: Number(f.cycleDays),
      alreadyPaid: f.alreadyPaid,
    };
    try {
      if (edit) await api(`/students/${initial!.id}`, { method: "PUT", body });
      else await api("/students", { method: "POST", body });
      onDone();
    } catch (e2) { setErr(e2 instanceof Error ? e2.message : "خطا"); }
    finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label">نام و نام خانوادگی</label><input required className="input" value={f.name} onChange={(e) => up("name", e.target.value)} /></div>
        <div><label className="label">زبان یا درس</label><input className="input" placeholder="مثلاً انگلیسی" value={f.language} onChange={(e) => up("language", e.target.value)} /></div>
        <div><label className="label">شماره تماس</label><input className="input" dir="ltr" value={f.phone} onChange={(e) => up("phone", e.target.value)} /></div>
        <div><label className="label">نام کاربری ورود</label><input required={!edit} disabled={edit} className="input" dir="ltr" value={f.username} onChange={(e) => up("username", e.target.value)} /></div>
        <div className="sm:col-span-2">
          <label className="label">{edit ? "رمز عبور جدید (اگر می‌خواهید عوض شود)" : "رمز عبور ورود"}</label>
          <input required={!edit} minLength={edit ? 0 : 6} className="input" dir="ltr" type="text" value={f.password} onChange={(e) => up("password", e.target.value)} />
        </div>
      </div>

      <div className="grid gap-4 border-t border-line pt-4 sm:grid-cols-3">
        <div><label className="label">جلسه در هر بسته</label><input required type="number" min={1} max={100} className="input" value={f.packageSessions} onChange={(e) => up("packageSessions", e.target.value)} /></div>
        <div><label className="label">شهریه‌ی هر بسته (تومان)</label><input required type="number" min={0} className="input" value={f.price} onChange={(e) => up("price", e.target.value)} /></div>
        <div><label className="label">هر چند روز پرداخت</label><input required type="number" min={1} max={365} className="input" value={f.cycleDays} onChange={(e) => up("cycleDays", e.target.value)} /></div>
      </div>

      <div><label className="label">یادداشت</label><textarea className="input" rows={2} value={f.notes} onChange={(e) => up("notes", e.target.value)} /></div>

      {!edit && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={f.alreadyPaid} onChange={(e) => up("alreadyPaid", e.target.checked)} />
          شهریه‌ی این بسته را همین حالا پرداخت کرده است
        </label>
      )}
      {err && <p className="text-sm text-rose" role="alert">{err}</p>}
      <div className="flex justify-end">
        <button disabled={busy} className="btn-primary">{edit ? "ذخیره‌ی تغییرات" : "افزودن زبان‌آموز"}</button>
      </div>
    </form>
  );
}
