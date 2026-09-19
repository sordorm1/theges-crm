"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAppData } from "@/lib/data/store-context";
import { StudentSearch } from "@/components/students/student-search";
import { StudentsTable } from "@/components/students/students-table";
import { AddStudentDialog } from "@/components/students/add-student-dialog";
import { StudentDetailSheet } from "@/components/students/student-detail-sheet";
import type { Student } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/lib/i18n/context";

function StudentsPageInner() {
  const { students, partners } = useAppData();
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const partnerFromUrl = searchParams.get("partner") ?? "all";

  const [partnerFilter, setPartnerFilter] = useState(partnerFromUrl);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  // Re-derived from `students` on every render (instead of storing the
  // Student object itself) so the detail dialog always reflects the latest
  // data after a mutation (fee update, new exam, comment) refetches it.
  const selected = selectedId ? (students.find((s) => s.id === selectedId) ?? null) : null;

  const filtered = useMemo(() => {
    const base =
      partnerFilter === "all"
        ? students
        : students.filter((s) => s.partnerId === partnerFilter);
    return [...base].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [students, partnerFilter]);

  function openStudent(s: Student) {
    setSelectedId(s.id);
    setDetailOpen(true);
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("students.title")}</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} {t("students.count")}</p>
        </div>
        <AddStudentDialog onOpenExisting={openStudent} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <StudentSearch onSelect={openStudent} />
        <Select
          value={partnerFilter}
          onValueChange={(v) => setPartnerFilter(v ?? "all")}
          items={{
            all: t("students.allPartners"),
            ...Object.fromEntries(partners.map((p) => [p.id, p.name])),
          }}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder={t("students.allPartners")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("students.allPartners")}</SelectItem>
            {partners.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <StudentsTable students={filtered} partners={partners} onOpen={openStudent} />

      <StudentDetailSheet
        student={selected}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}

export default function StudentsPage() {
  return (
    <Suspense fallback={null}>
      <StudentsPageInner />
    </Suspense>
  );
}
