import { jsonResponse, handleOptions } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";

interface RequestBody {
  action?: "create" | "delete";
  code?: string;
  name?: string;
  phone?: string;
  logoDataUrl?: string;
  partnerId?: string;
}

async function uploadLogo(db: ReturnType<typeof supabaseAdmin>, dataUrl: string, code: string) {
  const match = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error("Invalid logo data URL");
  const [, mime, base64] = match;
  const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
  const path = `${code.toLowerCase()}-${Date.now()}.${ext}`;
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

  const { error } = await db.storage.from("partner-logos").upload(path, bytes, {
    contentType: mime,
    upsert: true,
  });
  if (error) throw error;
  const { data } = db.storage.from("partner-logos").getPublicUrl(path);
  return data.publicUrl;
}

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const body = (await req.json()) as RequestBody;
    const db = supabaseAdmin();

    if (body.action === "delete") {
      if (!body.partnerId) return jsonResponse({ error: "partnerId is required" }, 400);
      const { error } = await db.from("partners").delete().eq("id", body.partnerId);
      if (error) throw error;
      return jsonResponse({ ok: true });
    }

    if (!body.name || !body.code) return jsonResponse({ error: "name and code are required" }, 400);

    const logoUrl = body.logoDataUrl ? await uploadLogo(db, body.logoDataUrl, body.code) : null;

    const { data, error } = await db
      .from("partners")
      .insert({ code: body.code, name: body.name, phone: body.phone ?? "", logo_url: logoUrl })
      .select("id, code, name, phone, logo_url, created_at")
      .single();
    if (error) throw error;

    return jsonResponse({
      id: data.id,
      code: data.code,
      name: data.name,
      phone: data.phone,
      logoDataUrl: data.logo_url ?? undefined,
      createdAt: data.created_at,
    });
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
