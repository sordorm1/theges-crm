export type Subject = string;

export interface SubjectRow {
  id: string;
  key: string;
  label: string;
  sortOrder: number;
}

export interface SubjectLevel {
  id: string;
  subjectId: string;
  label: string;
  sortOrder: number;
}

export interface ExamProgram {
  id: string;
  key: string;
  subject: Subject;
  name: string;
  shortName: string;
  color: string;
}

export type ExamStatus = "scheduled" | "passed" | "failed";

export interface PaymentComment {
  id: string;
  examRecordId: string;
  text: string;
  createdAt: string; // ISO datetime (UTC)
}

export interface ExamRecord {
  id: string;
  examProgramId: string;
  date: string; // ISO date
  status: ExamStatus;
  score?: string;
  levelLabel?: string;
  login: string;
  password: string;
  examKey: string;
  registrationFeeUsd?: number;
  examFeeUsd?: number;
  consultationFeeUsd?: number;
  paymentComments?: PaymentComment[];
}

export interface Partner {
  id: string;
  code: string;
  name: string;
  phone: string;
  logoDataUrl?: string;
  createdAt: string; // ISO date
}

export interface Student {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  passportNumber: string;
  phone: string;
  email?: string;
  partnerId: string | null;
  createdAt: string; // ISO date
  examRecords: ExamRecord[];
}

export interface DashboardFilters {
  from?: string;
  to?: string;
  partnerId?: string | "all";
  subject?: Subject | "all";
  status?: ExamStatus | "all";
}
