"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Copy, IdCard, Phone, Mail, Building2, Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import type { Student } from "@/lib/types";
import { useAppData } from "@/lib/data/store-context";
import { fullName, formatDate } from "@/lib/format";
import { getProgram } from "@/lib/data/programs";
import { StatusBadge } from "@/components/status-badge";
import { PaymentSection } from "@/components/students/payment-section";
import {
  ExamRecordForm,
  EMPTY_EXAM_RECORD_DRAFT,
  type ExamRecordDraft,
} from "@/components/students/exam-record-form";

function SecretField({ label, value }: { label: string; value: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex flex-col gap-1.5 rounded-lg bg-muted px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={() => setVisible((v) => !v)}
          >
            {visible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={() => {
              navigator.clipboard?.writeText(value);
              toast.success(`${label} скопирован`);
            }}
          >
            <Copy className="size-3.5" />
          </Button>
        </div>
      </div>
      <div className="font-mono text-sm break-all select-all">
        {visible ? value || "—" : "•".repeat(Math.min(value.length || 1, 10))}
      </div>
    </div>
  );
}

function AddExamRecordBlock({ studentId }: { studentId: string }) {
  const { addExamRecordToStudent } = useAppData();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exam, setExam] = useState<ExamRecordDraft>(EMPTY_EXAM_RECORD_DRAFT);

  if (!open) {
    return (
      <Button variant="outline" className="w-full gap-2" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Добавить экзамен
      </Button>
    );
  }

  async function handleSave() {
    if (!exam.programId) {
      toast.error("Выберите направление и экзамен");
      return;
    }
    setSaving(true);
    try {
      await addExamRecordToStudent(studentId, {
        examProgramId: exam.programId,
        date: exam.date || new Date().toISOString(),
        status: exam.status,
        levelLabel: exam.levelLabel || undefined,
        login: exam.login.trim(),
        password: exam.password.trim(),
        examKey: exam.examKey.trim(),
      });
      toast.success("Экзамен добавлен");
      setExam(EMPTY_EXAM_RECORD_DRAFT);
      setOpen(false);
    } catch {
      toast.error("Не удалось добавить экзамен");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <ExamRecordForm value={exam} onChange={setExam} />
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setOpen(false)}>
          Отмена
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          Сохранить
        </Button>
      </div>
    </div>
  );
}

export function StudentDetailSheet({
  student,
  open,
  onOpenChange,
}: {
  student: Student | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { partners, examPrograms } = useAppData();
  const partner = partners.find((p) => p.id === student?.partnerId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        {student && (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg">{fullName(student)}</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                  <IdCard className="size-4 shrink-0 text-muted-foreground" />
                  <span className="font-mono">{student.passportNumber}</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                  <Phone className="size-4 shrink-0 text-muted-foreground" />
                  <span>{student.phone || "—"}</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                  <Mail className="size-4 shrink-0 text-muted-foreground" />
                  <span>{student.email || "—"}</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                  <Building2 className="size-4 shrink-0 text-muted-foreground" />
                  <span>{partner ? `${partner.name} · ${partner.code}` : "Без партнёра"}</span>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Зарегистрирован: {formatDate(student.createdAt)}
              </div>

              <Separator />

              <div className="flex flex-col gap-4">
                <h4 className="text-sm font-semibold">Экзамены</h4>
                {student.examRecords.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Экзамены пока не назначены
                  </p>
                )}
                {student.examRecords.map((r) => {
                  const program = getProgram(examPrograms, r.examProgramId);
                  return (
                    <div
                      key={r.id}
                      className="flex flex-col gap-3 rounded-xl border border-border p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="text-sm font-semibold">{program?.name ?? r.examProgramId}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(r.date)}
                            {r.score ? ` · балл: ${r.score}` : ""}
                            {r.levelLabel ? ` · уровень: ${r.levelLabel}` : ""}
                          </div>
                        </div>
                        <StatusBadge status={r.status} />
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <SecretField label="Логин" value={r.login} />
                        <SecretField label="Пароль" value={r.password} />
                        <SecretField label="Exam Key" value={r.examKey} />
                      </div>

                      <PaymentSection examRecord={r} />
                    </div>
                  );
                })}

                <AddExamRecordBlock studentId={student.id} />
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
