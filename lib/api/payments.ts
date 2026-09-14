import { EDGE_FUNCTIONS_URL } from "@/lib/supabase/client";
import type { PaymentComment } from "@/lib/types";

export type FeeField = "registrationFeeUsd" | "examFeeUsd" | "consultationFeeUsd";
export type UpdateFeeResult =
  | { ok: true }
  | { ok: false; error: "PIN_REQUIRED" | "PIN_INVALID" | "NOT_FOUND" };

export async function updateExamFee(
  examRecordId: string,
  field: FeeField,
  value: number,
  pin?: string,
): Promise<UpdateFeeResult> {
  const res = await fetch(`${EDGE_FUNCTIONS_URL}/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "update-fee", examRecordId, field, value, pin }),
  });
  return res.json();
}

export async function addPaymentComment(
  examRecordId: string,
  text: string,
): Promise<PaymentComment> {
  const res = await fetch(`${EDGE_FUNCTIONS_URL}/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "add-comment", examRecordId, text }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to add comment");
  return data as PaymentComment;
}
