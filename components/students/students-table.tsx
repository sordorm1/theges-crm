"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { Student, Partner } from "@/lib/types";
import { fullName, formatDate } from "@/lib/format";
import { getProgram } from "@/lib/data/programs";
import { useAppData } from "@/lib/data/store-context";
import { StatusBadge } from "@/components/status-badge";
import { useTranslation } from "@/lib/i18n/context";

function DeleteStudentButton({ student }: { student: Student }) {
  const { deleteStudent } = useAppData();
  const { t } = useTranslation();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(t("students.deleteConfirm", fullName(student)))) return;
    setDeleting(true);
    try {
      await deleteStudent(student.id);
      toast.success(t("students.deletedToast"));
    } catch {
      toast.error(t("students.deleteFailedToast"));
      setDeleting(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-7 text-muted-foreground hover:text-destructive"
      onClick={handleDelete}
      disabled={deleting}
      aria-label={t("students.deleteAriaLabel")}
    >
      {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
    </Button>
  );
}

export function StudentsTable({
  students,
  partners,
  onOpen,
  programId,
}: {
  students: Student[];
  partners: Partner[];
  onOpen: (student: Student) => void;
  /** When set, show this specific exam program's record instead of the most recent one. */
  programId?: string;
}) {
  const { examPrograms } = useAppData();
  const { t, locale } = useTranslation();
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("students.tableHeaders.student")}</TableHead>
              <TableHead>{t("students.tableHeaders.passport")}</TableHead>
              <TableHead>{t("students.tableHeaders.partner")}</TableHead>
              <TableHead>{t("students.tableHeaders.program")}</TableHead>
              <TableHead>{t("students.tableHeaders.registeredAt")}</TableHead>
              <TableHead>{t("students.tableHeaders.status")}</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((s) => {
              const partner = partners.find((p) => p.id === s.partnerId);
              const lastExam = programId
                ? s.examRecords.find((r) => r.examProgramId === programId)
                : s.examRecords[s.examRecords.length - 1];
              const program = lastExam ? getProgram(examPrograms, lastExam.examProgramId) : undefined;
              return (
                <TableRow
                  key={s.id}
                  className="cursor-pointer"
                  onClick={() => onOpen(s)}
                >
                  <TableCell className="font-medium">{fullName(s)}</TableCell>
                  <TableCell className="font-mono text-xs">{s.passportNumber}</TableCell>
                  <TableCell>
                    {partner ? (
                      <span>
                        {partner.name}{" "}
                        <span className="text-muted-foreground">({partner.code})</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{program?.shortName ?? "—"}</TableCell>
                  <TableCell>{formatDate(s.createdAt, locale)}</TableCell>
                  <TableCell>
                    {lastExam ? <StatusBadge status={lastExam.status} /> : "—"}
                  </TableCell>
                  <TableCell>
                    <DeleteStudentButton student={s} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {students.length === 0 && (
        <p className="p-6 text-center text-sm text-muted-foreground">
          {t("students.notFound")}
        </p>
      )}
    </div>
  );
}
