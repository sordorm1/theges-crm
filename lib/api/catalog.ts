import { supabase, EDGE_FUNCTIONS_URL } from "@/lib/supabase/client";
import type { ExamProgram, SubjectRow, SubjectLevel } from "@/lib/types";

export async function listSubjects(): Promise<SubjectRow[]> {
  const { data, error } = await supabase
    .from("subjects")
    .select("id, key, label, sort_order")
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map((s) => ({
    id: s.id,
    key: s.key,
    label: s.label,
    sortOrder: s.sort_order,
  }));
}

export async function listSubjectLevels(): Promise<SubjectLevel[]> {
  const { data, error } = await supabase
    .from("subject_levels")
    .select("id, subject_id, label, sort_order")
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map((l) => ({
    id: l.id,
    subjectId: l.subject_id,
    label: l.label,
    sortOrder: l.sort_order,
  }));
}

export async function listExamPrograms(): Promise<ExamProgram[]> {
  const { data, error } = await supabase
    .from("exam_programs")
    .select("id, key, name, short_name, color, subjects!inner(key)")
    .order("name");
  if (error) throw error;
  return (data ?? []).map((p) => ({
    id: p.id,
    key: p.key,
    subject: (p.subjects as unknown as { key: string }).key,
    name: p.name,
    shortName: p.short_name,
    color: p.color,
  }));
}

async function callCatalogFunction(body: unknown) {
  const res = await fetch(`${EDGE_FUNCTIONS_URL}/catalog`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

export async function addSubject(key: string, label: string): Promise<SubjectRow> {
  return callCatalogFunction({ action: "add-subject", key, label });
}

export async function addSubjectLevel(subjectId: string, label: string): Promise<SubjectLevel> {
  return callCatalogFunction({ action: "add-level", subjectId, label });
}

export async function addExamProgram(
  subjectId: string,
  key: string,
  name: string,
  shortName: string,
  color: string,
): Promise<void> {
  await callCatalogFunction({ action: "add-program", subjectId, key, name, shortName, color });
}
