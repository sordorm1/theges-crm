"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  Copy,
  IdCard,
  Phone,
  Mail,
  Building2,
  Plus,
  Loader2,
  Pencil,
  Check,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ExamRecord, ExamStatus, Student } from "@/lib/types";
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

function ProfileSection({ student }: { student: Student }) {
  const { partners, updateStudentProfile } = useAppData();
  const partner = partners.find((p) => p.id === student.partnerId);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState(student.firstName);
  const [middleName, setMiddleName] = useState(student.middleName ?? "");
  const [lastName, setLastName] = useState(student.lastName);
  const [passport, setPassport] = useState(student.passportNumber);
  const [phone, setPhone] = useState(student.phone);
  const [email, setEmail] = useState(student.email ?? "");
  const [partnerId, setPartnerId] = useState(student.partnerId ?? "none");

  function startEdit() {
    setFirstName(student.firstName);
    setMiddleName(student.middleName ?? "");
    setLastName(student.lastName);
    setPassport(student.passportNumber);
    setPhone(student.phone);
    setEmail(student.email ?? "");
    setPartnerId(student.partnerId ?? "none");
    setEditing(true);
  }

  async function handleSave() {
    if (!firstName.trim() || !lastName.trim() || !passport.trim()) {
      toast.error("Заполните имя, фамилию и паспортные данные");
      return;
    }
    setSaving(true);
    try {
      await updateStudentProfile(student.id, {
        firstName: firstName.trim(),
        middleName: middleName.trim() || undefined,
        lastName: lastName.trim(),
        passportNumber: passport.trim().toUpperCase(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        partnerId: partnerId === "none" ? null : partnerId,
      });
      toast.success("Данные ученика обновлены");
      setEditing(false);
    } catch {
      toast.error("Не удалось сохранить изменения");
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label>Firstname</Label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Middlename</Label>
            <Input value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Lastname</Label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Паспортные данные</Label>
            <Input value={passport} onChange={(e) => setPassport(e.target.value.toUpperCase())} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Телефон</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Партнёр</Label>
          <Select
            value={partnerId}
            onValueChange={(v) => setPartnerId(v ?? "none")}
            items={{
              none: "Без партнёра",
              ...Object.fromEntries(partners.map((p) => [p.id, `${p.name} (${p.code})`])),
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Без партнёра</SelectItem>
              {partners.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
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

  return (
    <div className="flex flex-col gap-2">
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
      <Button variant="ghost" size="sm" className="w-fit gap-1.5 text-muted-foreground" onClick={startEdit}>
        <Pencil className="size-3.5" />
        Редактировать данные ученика
      </Button>
    </div>
  );
}

function ExamRecordCard({ record }: { record: ExamRecord }) {
  const { examPrograms, updateExamRecord } = useAppData();
  const program = getProgram(examPrograms, record.examProgramId);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(record.date?.slice(0, 10) ?? "");
  const [status, setStatus] = useState<ExamStatus>(record.status);
  const [levelLabel, setLevelLabel] = useState(record.levelLabel ?? "");
  const [login, setLogin] = useState(record.login);
  const [password, setPassword] = useState(record.password);
  const [examKey, setExamKey] = useState(record.examKey);

  function startEdit() {
    setDate(record.date?.slice(0, 10) ?? "");
    setStatus(record.status);
    setLevelLabel(record.levelLabel ?? "");
    setLogin(record.login);
    setPassword(record.password);
    setExamKey(record.examKey);
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateExamRecord(record.id, {
        date: date || record.date,
        status,
        levelLabel: levelLabel || undefined,
        login,
        password,
        examKey,
      });
      toast.success("Экзамен обновлён");
      setEditing(false);
    } catch {
      toast.error("Не удалось сохранить изменения");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold">{program?.name ?? record.examProgramId}</div>
          {!editing && (
            <div className="text-xs text-muted-foreground">
              {formatDate(record.date)}
              {record.score ? ` · балл: ${record.score}` : ""}
              {record.levelLabel ? ` · уровень: ${record.levelLabel}` : ""}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!editing && <StatusBadge status={record.status} />}
          {!editing && (
            <Button variant="ghost" size="icon" className="size-7" onClick={startEdit}>
              <Pencil className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label>Дата</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Статус</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus((v ?? "scheduled") as ExamStatus)}
                items={{ scheduled: "Запланирован", passed: "Сдал", failed: "Не сдал" }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Запланирован</SelectItem>
                  <SelectItem value="passed">Сдал</SelectItem>
                  <SelectItem value="failed">Не сдал</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Уровень</Label>
              <Input value={levelLabel} onChange={(e) => setLevelLabel(e.target.value)} placeholder="напр. B2" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label>Логин</Label>
              <Input value={login} onChange={(e) => setLogin(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Пароль</Label>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} className="font-mono" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Exam Key</Label>
              <Input value={examKey} onChange={(e) => setExamKey(e.target.value)} className="font-mono" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(false)} disabled={saving}>
              <X className="size-3.5" />
              Отмена
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
              Сохранить
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <SecretField label="Логин" value={record.login} />
          <SecretField label="Пароль" value={record.password} />
          <SecretField label="Exam Key" value={record.examKey} />
        </div>
      )}

      <PaymentSection examRecord={record} />
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
        registrationFeeUsd: exam.registrationFeeUsd ? Number(exam.registrationFeeUsd) : undefined,
        examFeeUsd: exam.examFeeUsd ? Number(exam.examFeeUsd) : undefined,
        consultationFeeUsd: exam.consultationFeeUsd ? Number(exam.consultationFeeUsd) : undefined,
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        {student && (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg">{fullName(student)}</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-5">
              <ProfileSection student={student} />

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
                {student.examRecords.map((r) => (
                  <ExamRecordCard key={r.id} record={r} />
                ))}

                <AddExamRecordBlock studentId={student.id} />
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
