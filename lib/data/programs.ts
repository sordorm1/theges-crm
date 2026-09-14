import type { ExamProgram } from "@/lib/types";

export const EXAM_PROGRAMS: ExamProgram[] = [
  {
    id: "ielts",
    subject: "english",
    name: "IELTS",
    shortName: "IELTS",
    color: "#1e5fbf",
  },
  {
    id: "intensive-online",
    subject: "english",
    name: "Intensive Online (2 месяца)",
    shortName: "Intensive",
    color: "#2f8fd6",
  },
  {
    id: "sat",
    subject: "math",
    name: "SAT",
    shortName: "SAT",
    color: "#0f9d58",
  },
  {
    id: "gre",
    subject: "math",
    name: "GRE",
    shortName: "GRE",
    color: "#16b3a3",
  },
  {
    id: "spanish-dele",
    subject: "spanish",
    name: "Испанский (DELE)",
    shortName: "Испанский",
    color: "#e07b1f",
  },
  {
    id: "arabic",
    subject: "arabic",
    name: "Арабский",
    shortName: "Арабский",
    color: "#8b5cf6",
  },
];

export const SUBJECT_LABELS: Record<string, string> = {
  english: "Английский",
  spanish: "Испанский",
  arabic: "Арабский",
  math: "Математика",
};

export function getProgram(id: string) {
  return EXAM_PROGRAMS.find((p) => p.id === id);
}

export function programsForSubject(subject: string) {
  return EXAM_PROGRAMS.filter((p) => p.subject === subject);
}
