import type { PayStatus } from "@/lib/types";

const MAP: Record<PayStatus, { label: string; cls: string }> = {
  paid: { label: "پرداخت شده", cls: "bg-lime/10 text-lime ring-lime/30 shadow-[0_0_14px_rgb(var(--lime)/.2)]" },
  due_soon: { label: "نزدیک سررسید", cls: "bg-amber/10 text-amber ring-amber/30 shadow-[0_0_14px_rgb(var(--amber)/.2)]" },
  overdue: { label: "سررسید گذشته", cls: "bg-rose/10 text-rose ring-rose/30 shadow-[0_0_14px_rgb(var(--rose)/.25)]" },
  unpaid: { label: "پرداخت نشده", cls: "bg-rose/10 text-rose ring-rose/30 shadow-[0_0_14px_rgb(var(--rose)/.25)]" },
};

export function StatusBadge({ status }: { status: PayStatus }) {
  const s = MAP[status];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${s.cls}`}>{s.label}</span>;
}
