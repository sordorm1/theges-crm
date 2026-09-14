"use server";

import { supabaseAdmin } from "@/lib/supabase/server";
import type { Partner } from "@/lib/types";

interface PartnerRow {
  id: string;
  code: string;
  name: string;
  phone: string;
  logo_url: string | null;
  created_at: string;
}

function mapPartner(p: PartnerRow): Partner {
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    phone: p.phone,
    logoDataUrl: p.logo_url ?? undefined,
    createdAt: p.created_at,
  };
}

export async function listPartners(): Promise<Partner[]> {
  const { data, error } = await supabaseAdmin()
    .from("partners")
    .select("id, code, name, phone, logo_url, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as PartnerRow[]).map(mapPartner);
}

/** Uploads an already-compressed data URL (see lib/image/compress.ts) to Storage and returns its public URL. */
async function uploadLogo(dataUrl: string, partnerCode: string): Promise<string> {
  const db = supabaseAdmin();
  const match = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error("Invalid logo data URL");
  const [, mime, base64] = match;
  const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
  const path = `${partnerCode.toLowerCase()}-${Date.now()}.${ext}`;
  const bytes = Buffer.from(base64, "base64");

  const { error } = await db.storage.from("partner-logos").upload(path, bytes, {
    contentType: mime,
    upsert: true,
  });
  if (error) throw error;

  const { data } = db.storage.from("partner-logos").getPublicUrl(path);
  return data.publicUrl;
}

export async function createPartner(input: {
  code: string;
  name: string;
  phone: string;
  logoDataUrl?: string;
}): Promise<Partner> {
  const logoUrl = input.logoDataUrl ? await uploadLogo(input.logoDataUrl, input.code) : null;

  const { data, error } = await supabaseAdmin()
    .from("partners")
    .insert({ code: input.code, name: input.name, phone: input.phone, logo_url: logoUrl })
    .select("id, code, name, phone, logo_url, created_at")
    .single();
  if (error) throw error;
  return mapPartner(data as PartnerRow);
}
