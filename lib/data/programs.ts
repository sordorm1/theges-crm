import type { ExamProgram, SubjectRow } from "@/lib/types";

export function getProgram(programs: ExamProgram[], id: string) {
  return programs.find((p) => p.id === id);
}

export function programsForSubject(programs: ExamProgram[], subjectId: string) {
  return programs.filter((p) => p.subject === subjectId);
}

export function subjectLabels(subjects: SubjectRow[]): Record<string, string> {
  return Object.fromEntries(subjects.map((s) => [s.key, s.label]));
}
