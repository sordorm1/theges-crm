import { jsonResponse, handleOptions } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";

type FeeField = "registrationFeeUsd" | "examFeeUsd" | "consultationFeeUsd";

const FIELD_TO_COLUMN: Record<FeeField, string> = {
  registrationFeeUsd: "registration_fee_usd",
  examFeeUsd: "exam_fee_usd",
  consultationFeeUsd: "consultation_fee_usd",
};

interface RequestBody {
  action: "update-fee" | "add-comment";
  examRecordId?: string;
  field?: FeeField;
  value?: number;
  pin?: string;
  text?: string;
}

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const body = (await req.json()) as RequestBody;
    const db = supabaseAdmin();

    if (body.action === "update-fee") {
      const { examRecordId, field, value, pin } = body;
      if (!examRecordId || !field || value === undefined) {
        return jsonResponse({ error: "examRecordId, field and value are required" }, 400);
      }
      const column = FIELD_TO_COLUMN[field];
      if (!column) return jsonResponse({ error: "Unknown field" }, 400);

      const { data: existing, error: fetchError } = await db
        .from("exam_records")
        .select("registration_fee_usd, exam_fee_usd, consultation_fee_usd")
        .eq("id", examRecordId)
        .single();
      if (fetchError || !existing) return jsonResponse({ ok: false, error: "NOT_FOUND" }, 404);

      const currentValue = (existing as Record<string, number | null>)[column];
      if (currentValue !== null && currentValue !== undefined) {
        if (!pin) return jsonResponse({ ok: false, error: "PIN_REQUIRED" });
        if (pin !== Deno.env.get("PAYMENT_EDIT_PIN")) {
          return jsonResponse({ ok: false, error: "PIN_INVALID" });
        }
      }

      const { error } = await db.from("exam_records").update({ [column]: value }).eq("id", examRecordId);
      if (error) throw error;
      return jsonResponse({ ok: true });
    }

    if (body.action === "add-comment") {
      if (!body.examRecordId || !body.text) {
        return jsonResponse({ error: "examRecordId and text are required" }, 400);
      }
      const { data, error } = await db
        .from("payment_comments")
        .insert({ exam_record_id: body.examRecordId, text: body.text })
        .select("id, exam_record_id, text, created_at")
        .single();
      if (error) throw error;
      return jsonResponse({
        id: data.id,
        examRecordId: data.exam_record_id,
        text: data.text,
        createdAt: data.created_at,
      });
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
