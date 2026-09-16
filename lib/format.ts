import type { Student } from "@/lib/types";

export function fullName(s: Pick<Student, "firstName" | "middleName" | "lastName">) {
  return [s.lastName, s.firstName, s.middleName].filter(Boolean).join(" ");
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Formats a UTC timestamp as local Tashkent (Asia/Tashkent, UTC+5) date & time. */
export function formatTashkentDateTime(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    timeZone: "Asia/Tashkent",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatUsd(value: number | undefined) {
  if (value === undefined || value === null) return "—";
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/** Russian plural rules for "ученик": 1 ученик, 2 ученика, 5 учеников. */
export function pluralizeStudents(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} ученик`;
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return `${count} ученика`;
  return `${count} учеников`;
}
