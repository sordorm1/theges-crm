"use server";

import { supabaseAdmin } from "@/lib/supabase/server";
import type { PaymentComment } from "@/lib/types";

export type FeeField = "registrationFeeUsd" | "examFeeUsd" | "consultationFeeUsd";

const FIELD_TO_COLUMN: Record<FeeField, string> = {
  registrationFeeUsd: "registration_fee_usd",
  examFeeUsd: "exam_fee_usd",
  consultationFeeUsd: "consultation_fee_usd",
};

export type UpdateFeeResult =
  | { ok: true }
  | { ok: false; error: "PIN_REQUIRED" | "PIN_INVALID" | "NOT_FOUND" };

/**
 * Updates a single fee field on an exam record. If the field already has a
 * saved (non-null) value, the caller must supply the correct PIN
 * (PAYMENT_EDIT_PIN) or the update is rejected. First-time entry (field is
 * currently null) never requires a PIN.
 */
export async function updateExamFee(
  examRecordId: string,
  field: FeeField,
  value: number,
  pin?: string,
): Promise<UpdateFeeResult> {
  const db = supabaseAdmin();
  const column = FIELD_TO_COLUMN[field];

  const { data: existing, error: fetchError } = await db
    .from("exam_records")
    .select("registration_fee_usd, exam_fee_usd, consultation_fee_usd")
    .eq("id", examRecordId)
    .single();
  if (fetchError || !existing) return { ok: false, error: "NOT_FOUND" };

  const currentValue = (existing as Record<string, number | null>)[column];
  if (currentValue !== null && currentValue !== undefined) {
    if (!pin) return { ok: false, error: "PIN_REQUIRED" };
    if (pin !== process.env.PAYMENT_EDIT_PIN) return { ok: false, error: "PIN_INVALID" };
  }

  const { error } = await db
    .from("exam_records")
    .update({ [column]: value })
    .eq("id", examRecordId);
  if (error) throw error;
  return { ok: true };
}

export async function addPaymentComment(
  examRecordId: string,
  text: string,
): Promise<PaymentComment> {
  const { data, error } = await supabaseAdmin()
    .from("payment_comments")
    .insert({ exam_record_id: examRecordId, text })
    .select("id, exam_record_id, text, created_at")
    .single();
  if (error) throw error;
  return {
    id: data.id,
    examRecordId: data.exam_record_id,
    text: data.text,
    createdAt: data.created_at,
  };
}
