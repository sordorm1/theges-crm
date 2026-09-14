import { jsonResponse, handleOptions } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";

interface RequestBody {
  action: "add-subject" | "add-level" | "add-program";
  key?: string;
  label?: string;
  subjectId?: string;
  name?: string;
  shortName?: string;
  color?: string;
}

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const body = (await req.json()) as RequestBody;
    const db = supabaseAdmin();

    if (body.action === "add-subject") {
      if (!body.key || !body.label) return jsonResponse({ error: "key and label are required" }, 400);
      const { data, error } = await db
        .from("subjects")
        .insert({ key: body.key, label: body.label, sort_order: 999 })
        .select("id, key, label, sort_order")
        .single();
      if (error) throw error;
      return jsonResponse({ id: data.id, key: data.key, label: data.label, sortOrder: data.sort_order });
    }

    if (body.action === "add-level") {
      if (!body.subjectId || !body.label) {
        return jsonResponse({ error: "subjectId and label are required" }, 400);
      }
      const { data, error } = await db
        .from("subject_levels")
        .insert({ subject_id: body.subjectId, label: body.label, sort_order: 999 })
        .select("id, subject_id, label, sort_order")
        .single();
      if (error) throw error;
      return jsonResponse({
        id: data.id,
        subjectId: data.subject_id,
        label: data.label,
        sortOrder: data.sort_order,
      });
    }

    if (body.action === "add-program") {
      if (!body.subjectId || !body.key || !body.name) {
        return jsonResponse({ error: "subjectId, key and name are required" }, 400);
      }
      const { error } = await db.from("exam_programs").insert({
        subject_id: body.subjectId,
        key: body.key,
        name: body.name,
        short_name: body.shortName ?? body.name,
        color: body.color ?? "#1e5fbf",
      });
      if (error) throw error;
      return jsonResponse({ ok: true });
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
