"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Student, Partner } from "@/lib/types";
import { fullName, formatDate } from "@/lib/format";
import { getProgram } from "@/lib/data/programs";
import { StatusBadge } from "@/components/status-badge";

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
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ученик</TableHead>
              <TableHead>Паспорт</TableHead>
              <TableHead>Партнёр</TableHead>
              <TableHead>Программа</TableHead>
              <TableHead>Дата регистрации</TableHead>
              <TableHead>Статус</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((s) => {
              const partner = partners.find((p) => p.id === s.partnerId);
              const lastExam = programId
                ? s.examRecords.find((r) => r.examProgramId === programId)
                : s.examRecords[s.examRecords.length - 1];
              const program = lastExam ? getProgram(lastExam.examProgramId) : undefined;
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
                  <TableCell>{formatDate(s.createdAt)}</TableCell>
                  <TableCell>
                    {lastExam ? <StatusBadge status={lastExam.status} /> : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {students.length === 0 && (
        <p className="p-6 text-center text-sm text-muted-foreground">
          Ученики не найдены
        </p>
      )}
    </div>
  );
}
