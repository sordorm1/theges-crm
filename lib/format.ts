import type { Student } from "@/lib/types";
import type { Locale } from "@/lib/i18n/context";

export function fullName(s: Pick<Student, "firstName" | "middleName" | "lastName">) {
  return [s.lastName, s.firstName, s.middleName].filter(Boolean).join(" ");
}

const UZ_MONTHS_SHORT = [
  "yan",
  "fev",
  "mar",
  "apr",
  "may",
  "iyn",
  "iyl",
  "avg",
  "sen",
  "okt",
  "noy",
  "dek",
];

export function formatDate(iso: string, locale: Locale = "ru") {
  const date = new Date(iso);
  if (locale === "uz") {
    const day = String(date.getDate()).padStart(2, "0");
    const month = UZ_MONTHS_SHORT[date.getMonth()];
    return `${day} ${month} ${date.getFullYear()}`;
  }
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Formats a UTC timestamp as local Tashkent (Asia/Tashkent, UTC+5) date & time. */
export function formatTashkentDateTime(iso: string, locale: Locale = "ru") {
  if (locale === "uz") {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Tashkent",
      day: "2-digit",
      month: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date(iso));
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    const month = UZ_MONTHS_SHORT[Number(get("month")) - 1];
    return `${get("day")} ${month} ${get("year")}, ${get("hour")}:${get("minute")}`;
  }
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
function pluralizeStudentsRu(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} ученик`;
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return `${count} ученика`;
  return `${count} учеников`;
}

/** Uzbek nouns are invariant — no plural suffix changes with count. */
export function pluralizeStudents(count: number, locale: Locale = "ru") {
  if (locale === "uz") return `${count} ta o'quvchi`;
  return pluralizeStudentsRu(count);
}
