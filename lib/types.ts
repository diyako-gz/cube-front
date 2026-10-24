export type Role = "teacher" | "student";
export interface Me { id: string; name: string; username: string; role: Role }
export type PayStatus = "unpaid" | "paid" | "due_soon" | "overdue";
export interface Student {
  id: string; name: string; username: string; phone: string; language: string; notes: string;
  packageSessions: number; price: number; cycleDays: number;
  sessionsTotal: number; sessionsLeft: number; sessionsHeld: number;
  lastPaidAt: string | null; nextDueAt: string | null;
  paymentStatus: PayStatus; daysToDue: number | null; createdAt: string;
  payable: boolean; payableFrom: string | null; // may the next period be paid now? / when payment opens
}
export type SessionStatus = "scheduled" | "held" | "absent" | "cancelled";
export interface Session {
  id: string; studentId: string; studentName: string; startsAt: string; durationMin: number; status: SessionStatus;
  isMakeup?: boolean; makeupFor?: string;
  summary?: string; homework?: string; weak?: string; notesAt?: string;
  rating?: "good" | "ok" | "bad" | ""; feedbackText?: string; feedbackAt?: string; // the student's opinion of the class
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
  hours?: { start: number; end: number; days: number[] }; // teachers only
  card?: { configured: boolean; masked: string; holder: string }; // teachers only
  payment?: { mode: string; configured: boolean; masked: string; sandbox: boolean }; // teachers only
}
export interface Receipt {
  payment: Payment; number: string; teacherName: string; packageSessions: number; nextDueAt: string | null;
}
export interface BadgeInfo { id: string; current: number; target: number; earned: boolean }
export interface PortalOverview {
  stats: { held: number; absent: number; rate: number; streak: number; bestStreak: number; firstAt: string | null };
  badges: BadgeInfo[];
  calendar: { startsAt: string; status: SessionStatus; durationMin: number }[];
}
export interface Slot { startsAt: string; endsAt: string }
export interface Transfer {
  id: string; studentId: string; studentName: string; amount: number; card: string; holder: string;
  status: "open" | "submitted" | "approving" | "approved" | "rejected" | "expired";
  expiresAt: string; createdAt: string; submittedAt: string | null; payerLast4: string; trackingNo: string;
  teacherNote: string; resolvedAt: string | null; hasReceipt: boolean;
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
  requests: SessionRequest[]; paymentEnabled: boolean; cardEnabled: boolean; transfers: Transfer[]; feedbackPending: Session[];
}
