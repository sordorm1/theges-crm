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
