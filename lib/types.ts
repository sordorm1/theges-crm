export type Subject = "english" | "spanish" | "arabic" | "math";

export interface ExamProgram {
  id: string;
  subject: Subject;
  name: string;
  shortName: string;
  color: string;
}

export type ExamStatus = "scheduled" | "passed" | "failed";

export interface ExamRecord {
  id: string;
  examProgramId: string;
  date: string; // ISO date
  status: ExamStatus;
  score?: string;
  login: string;
  password: string;
  examKey: string;
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
