import { jsonResponse, handleOptions } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";

const STUDENT_SELECT = `
  id, first_name, middle_name, last_name, passport_number, phone, email, partner_id, created_at,
  exam_records (
    id, exam_program_id, date, status, score, level_label, login, password, exam_key,
    registration_fee_usd, exam_fee_usd, consultation_fee_usd,
    payment_comments ( id, exam_record_id, text, created_at )
  )
`;

// deno-lint-ignore no-explicit-any
function mapStudent(s: any) {
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
    // deno-lint-ignore no-explicit-any
    examRecords: (s.exam_records ?? []).map((r: any) => ({
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
      // deno-lint-ignore no-explicit-any
      paymentComments: (r.payment_comments ?? []).map((c: any) => ({
        id: c.id,
        examRecordId: c.exam_record_id,
        text: c.text,
        createdAt: c.created_at,
      })),
    })),
  };
}

interface ExamRecordInput {
  examProgramId: string;
  date: string;
  status: string;
  levelLabel?: string;
  login: string;
  password: string;
  examKey: string;
}

interface RequestBody {
  action: "create" | "add-exam";
  student?: {
    firstName: string;
    middleName?: string;
    lastName: string;
    passportNumber: string;
    phone: string;
    email?: string;
    partnerId: string | null;
    examRecord?: ExamRecordInput;
  };
  studentId?: string;
  examRecord?: ExamRecordInput;
}

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const body = (await req.json()) as RequestBody;
    const db = supabaseAdmin();

    if (body.action === "create") {
      const input = body.student;
      if (!input) return jsonResponse({ error: "student is required" }, 400);

      const { data: student, error } = await db
        .from("students")
        .insert({
          first_name: input.firstName,
          middle_name: input.middleName ?? null,
          last_name: input.lastName,
          passport_number: input.passportNumber,
          phone: input.phone,
          email: input.email ?? null,
          partner_id: input.partnerId,
        })
        .select("id")
        .single();
      if (error) throw error;

      if (input.examRecord) {
        const { error: examError } = await db.from("exam_records").insert({
          student_id: student.id,
          exam_program_id: input.examRecord.examProgramId,
          date: input.examRecord.date,
          status: input.examRecord.status,
          level_label: input.examRecord.levelLabel ?? null,
          login: input.examRecord.login,
          password: input.examRecord.password,
          exam_key: input.examRecord.examKey,
        });
        if (examError) throw examError;
      }

      const { data: full, error: fetchError } = await db
        .from("students")
        .select(STUDENT_SELECT)
        .eq("id", student.id)
        .single();
      if (fetchError) throw fetchError;
      return jsonResponse(mapStudent(full));
    }

    if (body.action === "add-exam") {
      if (!body.studentId || !body.examRecord) {
        return jsonResponse({ error: "studentId and examRecord are required" }, 400);
      }
      const { error } = await db.from("exam_records").insert({
        student_id: body.studentId,
        exam_program_id: body.examRecord.examProgramId,
        date: body.examRecord.date,
        status: body.examRecord.status,
        level_label: body.examRecord.levelLabel ?? null,
        login: body.examRecord.login,
        password: body.examRecord.password,
        exam_key: body.examRecord.examKey,
      });
      if (error) throw error;

      const { data: full, error: fetchError } = await db
        .from("students")
        .select(STUDENT_SELECT)
        .eq("id", body.studentId)
        .single();
      if (fetchError) throw fetchError;
      return jsonResponse(mapStudent(full));
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
