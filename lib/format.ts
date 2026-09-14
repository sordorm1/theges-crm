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
