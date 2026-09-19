import * as XLSX from "xlsx";
import type { ExamProgram, Partner, Student } from "@/lib/types";
import type { Locale } from "@/lib/i18n/context";

const HEADERS: Record<Locale, string[]> = {
  uz: ["", "daraja yoki level", "Exam key", "Ism Familya", "Partnyor"],
  ru: ["", "Уровень", "Exam key", "Имя Фамилия", "Партнёр"],
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
    const examKey = record?.examKey ?? "";
    const numericKey = examKey && /^\d+$/.test(examKey) ? Number(examKey) : examKey;
    return [
      i + 1,
      record?.levelLabel ?? "",
      numericKey,
      [s.firstName, s.lastName].filter(Boolean).join(" "),
      partner?.name ?? "",
    ];
  });

  const sheet = XLSX.utils.aoa_to_sheet([HEADERS[locale], ...rows]);
  sheet["!cols"] = [{ wch: 4 }, { wch: 18 }, { wch: 14 }, { wch: 28 }, { wch: 24 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, program.shortName.slice(0, 31) || "Exam");

  const fileName = `${program.shortName || program.name}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
