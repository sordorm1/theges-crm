import { supabaseAdmin } from "./supabase.ts";

type Db = ReturnType<typeof supabaseAdmin>;

/**
 * Keeps the finance ledger in sync with one exam record's current state:
 * - registration / consultation are deducted from the partner's deposit as
 *   soon as an amount is set, regardless of exam status.
 * - the exam fee is only deducted once the student has actually sat the
 *   exam (status is 'passed' or 'failed'); while 'scheduled' it stays
 *   un-deducted even if a fee amount is already entered.
 * Safe to call after every write to an exam_record - it upserts (or
 * removes) exactly one ledger row per (exam_record, kind), so re-running it
 * never double-counts.
 */
export async function reconcileExamRecordFinance(db: Db, examRecordId: string): Promise<void> {
  const { data: record, error } = await db
    .from("exam_records")
    .select("id, student_id, status, registration_fee_usd, exam_fee_usd, consultation_fee_usd")
    .eq("id", examRecordId)
    .single();
  if (error || !record) return;

  const { data: student, error: studentError } = await db
    .from("students")
    .select("id, partner_id")
    .eq("id", record.student_id)
    .single();
  if (studentError || !student || !student.partner_id) {
    // No partner attached - nothing to deduct against, but clear any stale
    // entries from a previous partner assignment.
    await db.from("finance_transactions").delete().eq("exam_record_id", examRecordId);
    return;
  }

  const attended = record.status === "passed" || record.status === "failed";

  const desired: { kind: "registration" | "consultation" | "exam"; amount: number | null }[] = [
    { kind: "registration", amount: record.registration_fee_usd },
    { kind: "consultation", amount: record.consultation_fee_usd },
    { kind: "exam", amount: attended ? record.exam_fee_usd : null },
  ];

  for (const { kind, amount } of desired) {
    if (amount === null || amount === undefined) {
      await db
        .from("finance_transactions")
        .delete()
        .eq("exam_record_id", examRecordId)
        .eq("kind", kind);
      continue;
    }

    // Partial unique index (exam_record_id, kind) doesn't play well with
    // supabase-js's upsert() ON CONFLICT target, so do it manually instead.
    const { data: existing } = await db
      .from("finance_transactions")
      .select("id")
      .eq("exam_record_id", examRecordId)
      .eq("kind", kind)
      .maybeSingle();

    if (existing) {
      await db
        .from("finance_transactions")
        .update({ amount_usd: amount })
        .eq("id", existing.id);
    } else {
      await db.from("finance_transactions").insert({
        partner_id: student.partner_id,
        student_id: student.id,
        exam_record_id: examRecordId,
        kind,
        amount_usd: amount,
      });
    }
  }
}

/** Removes all ledger entries tied to an exam record (e.g. before it's deleted). */
export async function clearExamRecordFinance(db: Db, examRecordId: string): Promise<void> {
  await db.from("finance_transactions").delete().eq("exam_record_id", examRecordId);
}
