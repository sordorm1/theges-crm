import { supabase, EDGE_FUNCTIONS_URL } from "@/lib/supabase/client";
import type { ExamRecord, ExamStatus, PaymentComment, Student } from "@/lib/types";

interface ExamRecordRow {
  id: string;
  exam_program_id: string;
  date: string;
  status: ExamRecord["status"];
  score: string | null;
  level_label: string | null;
  login: string;
  password: string;
  exam_key: string;
  registration_fee_usd: number | null;
  exam_fee_usd: number | null;
  consultation_fee_usd: number | null;
  payment_comments?: PaymentCommentRow[];
}

interface PaymentCommentRow {
  id: string;
  exam_record_id: string;
  text: string;
  created_at: string;
}

interface StudentRow {
  id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  passport_number: string;
  phone: string;
  email: string | null;
  partner_id: string | null;
  created_at: string;
  exam_records: ExamRecordRow[];
}

function mapComment(c: PaymentCommentRow): PaymentComment {
  return { id: c.id, examRecordId: c.exam_record_id, text: c.text, createdAt: c.created_at };
}

function mapExamRecord(r: ExamRecordRow): ExamRecord {
  return {
    id: r.id,
    examProgramId: r.exam_program_id,
    date: r.date,
    status: r.status,
    score: r.score ?? undefined,
    levelLabel: r.level_label ?? undefined,
    login: r.login,
    password: r.password,
    examKey: r.exam_key,
    registrationFeeUsd: r.registration_fee_usd ?? undefined,
    examFeeUsd: r.exam_fee_usd ?? undefined,
    consultationFeeUsd: r.consultation_fee_usd ?? undefined,
    paymentComments: (r.payment_comments ?? []).map(mapComment),
  };
}

function mapStudent(s: StudentRow): Student {
  return {
    id: s.id,
    firstName: s.first_name,
    middleName: s.middle_name ?? undefined,
    lastName: s.last_name,
    passportNumber: s.passport_number,
    phone: s.phone,
    email: s.email ?? undefined,
    partnerId: s.partner_id,
    createdAt: s.created_at,
    examRecords: (s.exam_records ?? [])
      .map(mapExamRecord)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
  };
}

const STUDENT_SELECT = `
  id, first_name, middle_name, last_name, passport_number, phone, email, partner_id, created_at,
  exam_records (
    id, exam_program_id, date, status, score, level_label, login, password, exam_key,
    registration_fee_usd, exam_fee_usd, consultation_fee_usd,
    payment_comments ( id, exam_record_id, text, created_at )
  )
`;

export async function listStudents(): Promise<Student[]> {
  const { data, error } = await supabase
    .from("students")
    .select(STUDENT_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as StudentRow[]).map(mapStudent);
}

interface ExamRecordInput {
  examProgramId: string;
  date: string;
  status: ExamStatus;
  levelLabel?: string;
  login: string;
  password: string;
  examKey: string;
}

async function callStudentsFunction(body: unknown): Promise<Student> {
  const res = await fetch(`${EDGE_FUNCTIONS_URL}/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data as Student;
}

export async function createStudent(input: {
  firstName: string;
  middleName?: string;
  lastName: string;
  passportNumber: string;
  phone: string;
  email?: string;
  partnerId: string | null;
  examRecord?: ExamRecordInput;
}): Promise<Student> {
  return callStudentsFunction({ action: "create", student: input });
}

export async function addExamRecordToStudent(
  studentId: string,
  examRecord: ExamRecordInput,
): Promise<Student> {
  return callStudentsFunction({ action: "add-exam", studentId, examRecord });
}
