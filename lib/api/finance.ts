import { supabase, EDGE_FUNCTIONS_URL } from "@/lib/supabase/client";
import type { FinanceTransaction } from "@/lib/types";

interface FinanceTransactionRow {
  id: string;
  partner_id: string;
  student_id: string | null;
  exam_record_id: string | null;
  kind: FinanceTransaction["kind"];
  amount_usd: number;
  note: string | null;
  created_at: string;
}

function mapTransaction(t: FinanceTransactionRow): FinanceTransaction {
  return {
    id: t.id,
    partnerId: t.partner_id,
    studentId: t.student_id ?? undefined,
    examRecordId: t.exam_record_id ?? undefined,
    kind: t.kind,
    amountUsd: Number(t.amount_usd),
    note: t.note ?? undefined,
    createdAt: t.created_at,
  };
}

export async function listFinanceTransactions(): Promise<FinanceTransaction[]> {
  const { data, error } = await supabase
    .from("finance_transactions")
    .select("id, partner_id, student_id, exam_record_id, kind, amount_usd, note, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as FinanceTransactionRow[]).map(mapTransaction);
}

export async function addDeposit(
  partnerId: string,
  amount: number,
  note?: string,
): Promise<FinanceTransaction> {
  const res = await fetch(`${EDGE_FUNCTIONS_URL}/finance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "add-deposit", partnerId, amount, note }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to add deposit");
  return mapTransaction({
    id: data.id,
    partner_id: data.partnerId,
    student_id: null,
    exam_record_id: null,
    kind: data.kind,
    amount_usd: data.amountUsd,
    note: data.note ?? null,
    created_at: data.createdAt,
  });
}

export async function deleteFinanceTransaction(transactionId: string): Promise<void> {
  const res = await fetch(`${EDGE_FUNCTIONS_URL}/finance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "delete-transaction", transactionId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to delete transaction");
}
