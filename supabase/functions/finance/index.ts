import { jsonResponse, handleOptions } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";

interface RequestBody {
  action: "add-deposit" | "delete-transaction";
  partnerId?: string;
  amount?: number;
  type?: "in" | "out";
  note?: string;
  transactionId?: string;
}

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const body = (await req.json()) as RequestBody;
    const db = supabaseAdmin();

    if (body.action === "add-deposit") {
      if (!body.partnerId || body.amount === undefined || body.amount <= 0) {
        return jsonResponse({ error: "partnerId and a positive amount are required" }, 400);
      }
      const signedAmount = body.type === "out" ? -body.amount : body.amount;
      const { data, error } = await db
        .from("finance_transactions")
        .insert({
          partner_id: body.partnerId,
          kind: "deposit",
          amount_usd: signedAmount,
          note: body.note ?? null,
        })
        .select("id, partner_id, kind, amount_usd, note, created_at")
        .single();
      if (error) throw error;
      return jsonResponse({
        id: data.id,
        partnerId: data.partner_id,
        kind: data.kind,
        amountUsd: data.amount_usd,
        note: data.note ?? undefined,
        createdAt: data.created_at,
      });
    }

    if (body.action === "delete-transaction") {
      if (!body.transactionId) return jsonResponse({ error: "transactionId is required" }, 400);
      // Only manual deposits should be deletable directly - deduction rows
      // are derived from exam records and should be edited there instead.
      const { error } = await db
        .from("finance_transactions")
        .delete()
        .eq("id", body.transactionId)
        .eq("kind", "deposit");
      if (error) throw error;
      return jsonResponse({ ok: true });
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
