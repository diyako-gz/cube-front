export const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";
const KEY = "daftar_token";

export const tokenStore = {
  get: (): string | null => (typeof window === "undefined" ? null : localStorage.getItem(KEY)),
  set: (t: string) => localStorage.setItem(KEY, t),
  clear: () => localStorage.removeItem(KEY),
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
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
  if (!res.ok) throw new ApiError(data?.error ?? "خطای ناشناخته", res.status);
  return data as T;
}

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
