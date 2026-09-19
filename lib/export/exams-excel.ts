import * as XLSX from "xlsx";
import type { ExamProgram, Partner, Student } from "@/lib/types";
import type { Locale } from "@/lib/i18n/context";
import { formatDate } from "@/lib/format";

const HEADERS: Record<Locale, string[]> = {
  ru: [
    "№",
    "ФИО",
    "Паспорт",
    "Партнёр",
    "Уровень",
    "Exam Key",
    "Логин",
    "Пароль",
    "Дата",
    "Статус",
    "Регистрация, $",
    "Экзамен, $",
    "Консультация, $",
  ],
  uz: [
    "№",
    "Ism Familya",
    "Pasport",
    "Hamkor",
    "Daraja",
    "Exam Key",
    "Login",
    "Parol",
    "Sana",
    "Holat",
    "Ro'yxat, $",
    "Imtihon, $",
    "Konsultatsiya, $",
  ],
};

const STATUS_LABEL: Record<Locale, Record<string, string>> = {
  ru: { scheduled: "Запланирован", passed: "Сдал", failed: "Не сдал" },
  uz: { scheduled: "Rejalashtirilgan", passed: "Topshirdi", failed: "Topshirmadi" },
};

export function exportExamProgramToExcel(
  students: Student[],
  program: ExamProgram,
  partners: Partner[],
  locale: Locale,
) {
  const rows = students.map((s, i) => {
    const record = s.examRecords.find((r) => r.examProgramId === program.id);
    const partner = partners.find((p) => p.id === s.partnerId);
    const fullName = [s.lastName, s.firstName, s.middleName].filter(Boolean).join(" ");
    return [
      i + 1,
      fullName,
      s.passportNumber,
      partner ? `${partner.name} (${partner.code})` : "",
      record?.levelLabel ?? "",
      record?.examKey ?? "",
      record?.login ?? "",
      record?.password ?? "",
      record ? formatDate(record.date, locale) : "",
      record ? STATUS_LABEL[locale][record.status] : "",
      record?.registrationFeeUsd ?? "",
      record?.examFeeUsd ?? "",
      record?.consultationFeeUsd ?? "",
    ];
  });

  const sheet = XLSX.utils.aoa_to_sheet([HEADERS[locale], ...rows]);
  sheet["!cols"] = [
    { wch: 4 },
    { wch: 26 },
    { wch: 12 },
    { wch: 22 },
    { wch: 10 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 16 },
    { wch: 12 },
    { wch: 10 },
    { wch: 14 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, program.shortName.slice(0, 31) || "Exam");

  const fileName = `${program.shortName || program.name}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
