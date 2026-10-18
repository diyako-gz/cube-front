export type Role = "teacher" | "student";
export interface Me { id: string; name: string; username: string; role: Role }
export type PayStatus = "unpaid" | "paid" | "due_soon" | "overdue";
export interface Student {
  id: string; name: string; username: string; phone: string; language: string; notes: string;
  packageSessions: number; price: number; cycleDays: number;
  sessionsTotal: number; sessionsLeft: number; sessionsHeld: number;
  lastPaidAt: string | null; nextDueAt: string | null;
  paymentStatus: PayStatus; daysToDue: number | null; createdAt: string;
}
export type SessionStatus = "scheduled" | "held" | "absent" | "cancelled";
export interface Session {
  id: string; studentId: string; studentName: string; startsAt: string; durationMin: number; status: SessionStatus;
  isMakeup?: boolean; makeupFor?: string;
  summary?: string; homework?: string; weak?: string; notesAt?: string;
}
export interface SessionRequest {
  id: string; studentId: string; studentName: string; sessionId: string; sessionAt: string;
  type: "cancel" | "reschedule"; proposedAt: string | null; note: string; late: boolean;
  status: "pending" | "approved" | "rejected"; teacherNote: string; createdAt: string; resolvedAt: string | null;
}
export interface StudentsPage {
  items: Student[]; total: number; page: number; pages: number;
  counts: { all: number; pay: number; low: number };
}
export interface SettingsInfo {
  telegram: { enabled: boolean; linked: boolean; bot: string };
  push: { enabled: boolean };
  calendar: { url: string; webcal: string };
}
export interface Receipt {
  payment: Payment; number: string; teacherName: string; packageSessions: number; nextDueAt: string | null;
}
export interface AuthConfig { registration: "open" | "invite" | "closed"; passwordReset: boolean }
export interface Payment { id: string; studentId: string; studentName: string; amount: number; paidAt: string; note: string }
export interface AppNotification { id: string; kind: string; title: string; body: string; read: boolean; createdAt: string }
export interface Dashboard {
  students: number; paid: number; dueSoon: number; unpaid: number; lowSessions: number; outstanding: number;
  needsAttention: Student[]; pendingSessions: Session[]; upcomingSessions: Session[];
}
export interface IncomeReport {
  total: number; count: number;
  daily: { day: string; amount: number }[];
  students: { name: string; amount: number; count: number }[];
}
export interface Portal {
  student: Student; teacherName: string; upcoming: Session[]; recent: Session[]; payments: Payment[];
  requests: SessionRequest[];
}
