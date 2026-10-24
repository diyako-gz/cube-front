export const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";
const KEY = "daftar_token";

export const tokenStore = {
  get: (): string | null => (typeof window === "undefined" ? null : localStorage.getItem(KEY)),
  set: (t: string) => localStorage.setItem(KEY, t),
  clear: () => localStorage.removeItem(KEY),
};

export class ApiError extends Error {
  status: number;
  code?: string; // machine-readable reason from the server, e.g. "early"
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function api<T>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = tokenStore.get();
  let res: Response;
  try {
    res = await fetch(API + path, {
      method: opts.method ?? "GET",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new ApiError("ارتباط با سرور برقرار نشد", 0);
  }
  const data = await res.json().catch(() => null);
  if (res.status === 401 && token) {
    tokenStore.clear();
    if (typeof window !== "undefined" && !location.pathname.startsWith("/login")) location.href = "/login";
  }
  if (!res.ok) throw new ApiError(data?.error ?? "خطای ناشناخته", res.status, data?.code);
  return data as T;
}

/** Downloads a file that needs the login token (a plain <a href> cannot send it). */
export async function download(path: string, filename: string) {
  const token = tokenStore.get();
  const res = await fetch(API + path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) {
    const d = await res.json().catch(() => null);
    throw new ApiError(d?.error ?? "دانلود انجام نشد", res.status);
  }
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * Teacher records a payment by hand. The server refuses a payment that is too early
 * (the period is not due yet); the teacher may still confirm it explicitly.
 * Returns false if the teacher backed out.
 */
export async function recordPayment(studentId: string, body: { amount?: number; note?: string }): Promise<boolean> {
  try {
    await api(`/students/${studentId}/payments`, { method: "POST", body });
    return true;
  } catch (e) {
    if (e instanceof ApiError && e.code === "early") {
      if (!confirm(`${e.message}\nمطمئنید می‌خواهید پرداخت را زودتر از موعد ثبت کنید؟`)) return false;
      await api(`/students/${studentId}/payments`, { method: "POST", body: { ...body, force: true } });
      return true;
    }
    throw e;
  }
}

/** POST a multipart/form-data body (e.g. a file) with the login token attached. */
export async function apiUpload<T>(path: string, form: FormData): Promise<T> {
  const token = tokenStore.get();
  let res: Response;
  try {
    res = await fetch(API + path, { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form });
  } catch {
    throw new ApiError("ارتباط با سرور برقرار نشد", 0);
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(data?.error ?? "خطای ناشناخته", res.status, data?.code);
  return data as T;
}

/** URL of an uploaded transfer receipt image (needs the Authorization header, so <img src> alone will not load it — see ReceiptImage). */
export const receiptURL = (transferId: string) => `${API}/transfers/${transferId}/receipt`;
