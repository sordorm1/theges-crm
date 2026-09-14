"use server";

import { supabaseAdmin } from "@/lib/supabase/server";
import type { ExamProgram, SubjectRow, SubjectLevel } from "@/lib/types";

export async function listSubjects(): Promise<SubjectRow[]> {
  const { data, error } = await supabaseAdmin()
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

export async function addSubject(key: string, label: string): Promise<SubjectRow> {
  const { data, error } = await supabaseAdmin()
    .from("subjects")
    .insert({ key, label, sort_order: 999 })
    .select("id, key, label, sort_order")
    .single();
  if (error) throw error;
  return { id: data.id, key: data.key, label: data.label, sortOrder: data.sort_order };
}

export async function listSubjectLevels(subjectId?: string): Promise<SubjectLevel[]> {
  let query = supabaseAdmin()
    .from("subject_levels")
    .select("id, subject_id, label, sort_order")
    .order("sort_order");
  if (subjectId) query = query.eq("subject_id", subjectId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((l) => ({
    id: l.id,
    subjectId: l.subject_id,
    label: l.label,
    sortOrder: l.sort_order,
  }));
}

export async function addSubjectLevel(subjectId: string, label: string): Promise<SubjectLevel> {
  const { data, error } = await supabaseAdmin()
    .from("subject_levels")
    .insert({ subject_id: subjectId, label, sort_order: 999 })
    .select("id, subject_id, label, sort_order")
    .single();
  if (error) throw error;
  return { id: data.id, subjectId: data.subject_id, label: data.label, sortOrder: data.sort_order };
}

export async function listExamPrograms(): Promise<ExamProgram[]> {
  const { data, error } = await supabaseAdmin()
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

export async function addExamProgram(
  subjectId: string,
  key: string,
  name: string,
  shortName: string,
  color: string,
): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("exam_programs")
    .insert({ subject_id: subjectId, key, name, short_name: shortName, color });
  if (error) throw error;
}
