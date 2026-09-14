import type { DashboardFilters, Partner, Student } from "@/lib/types";
import { EXAM_PROGRAMS, getProgram } from "@/lib/data/programs";

export function applyFilters(
  students: Student[],
  filters: DashboardFilters,
): Student[] {
  const from = filters.from ? new Date(filters.from).getTime() : null;
  const to = filters.to ? new Date(filters.to).getTime() : null;

  return students.filter((s) => {
    if (filters.partnerId && filters.partnerId !== "all" && s.partnerId !== filters.partnerId) {
      return false;
    }

    const createdAt = new Date(s.createdAt).getTime();
    if (from && createdAt < from) return false;
    if (to && createdAt > to) return false;

    if (filters.subject && filters.subject !== "all") {
      const hasSubject = s.examRecords.some(
        (r) => getProgram(r.examProgramId)?.subject === filters.subject,
      );
      if (!hasSubject) return false;
    }

    if (filters.status && filters.status !== "all") {
      const hasStatus = s.examRecords.some((r) => r.status === filters.status);
      if (!hasStatus) return false;
    }

    return true;
  });
}

export function monthKey(dateIso: string) {
  const d = new Date(dateIso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const MONTH_LABELS_RU = [
  "Янв",
  "Фев",
  "Мар",
  "Апр",
  "Май",
  "Июн",
  "Июл",
  "Авг",
  "Сен",
  "Окт",
  "Ноя",
  "Дек",
];

export function monthlyEnrollment(students: Student[], monthsBack = 12) {
  const now = new Date();
  const buckets: { key: string; label: string; count: number }[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.push({ key, label: MONTH_LABELS_RU[d.getMonth()], count: 0 });
  }
  const byKey = new Map(buckets.map((b) => [b.key, b]));
  for (const s of students) {
    const key = monthKey(s.createdAt);
    const bucket = byKey.get(key);
    if (bucket) bucket.count += 1;
  }
  return buckets;
}

export function partnerRanking(students: Student[], partners: Partner[]) {
  const counts = new Map<string, number>();
  for (const s of students) {
    if (!s.partnerId) continue;
    counts.set(s.partnerId, (counts.get(s.partnerId) ?? 0) + 1);
  }
  return partners
    .map((p) => ({ partner: p, count: counts.get(p.id) ?? 0 }))
    .sort((a, b) => b.count - a.count);
}

export function programPopularity(students: Student[]) {
  const counts = new Map<string, number>();
  for (const s of students) {
    for (const r of s.examRecords) {
      counts.set(r.examProgramId, (counts.get(r.examProgramId) ?? 0) + 1);
    }
  }
  return EXAM_PROGRAMS.map((p) => ({
    program: p,
    count: counts.get(p.id) ?? 0,
  })).sort((a, b) => b.count - a.count);
}

export function currentMonthCount(students: Student[]) {
  const now = new Date();
  const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return students.filter((s) => monthKey(s.createdAt) === key).length;
}

export function passRate(students: Student[]) {
  let passed = 0;
  let finished = 0;
  for (const s of students) {
    for (const r of s.examRecords) {
      if (r.status === "passed" || r.status === "failed") {
        finished += 1;
        if (r.status === "passed") passed += 1;
      }
    }
  }
  if (finished === 0) return 0;
  return Math.round((passed / finished) * 100);
}
