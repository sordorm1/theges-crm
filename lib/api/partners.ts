import { supabase, EDGE_FUNCTIONS_URL } from "@/lib/supabase/client";
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
  const { data, error } = await supabase
    .from("partners")
    .select("id, code, name, phone, logo_url, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as PartnerRow[]).map(mapPartner);
}

export async function createPartner(input: {
  code: string;
  name: string;
  phone: string;
  logoDataUrl?: string;
}): Promise<Partner> {
  const res = await fetch(`${EDGE_FUNCTIONS_URL}/partners`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to create partner");
  return data as Partner;
}
