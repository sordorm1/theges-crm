"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { useAppData } from "@/lib/data/store-context";
import { fullName } from "@/lib/format";
import type { Student } from "@/lib/types";
import {
  ExamRecordForm,
  EMPTY_EXAM_RECORD_DRAFT,
  type ExamRecordDraft,
} from "@/components/students/exam-record-form";
import { useTranslation } from "@/lib/i18n/context";

export function AddStudentDialog({
  defaultPartnerId,
  onOpenExisting,
}: {
  defaultPartnerId?: string;
  onOpenExisting: (student: Student) => void;
}) {
  const { partners, addStudent, findStudentsByQuery } = useAppData();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [passport, setPassport] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [partnerId, setPartnerId] = useState<string>(defaultPartnerId ?? "none");
  const [exam, setExam] = useState<ExamRecordDraft>(EMPTY_EXAM_RECORD_DRAFT);

  const duplicate = useMemo(() => {
    if (!passport.trim() || passport.trim().length < 4) return [];
    return findStudentsByQuery(passport.trim());
  }, [passport, findStudentsByQuery]);

  function reset() {
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setPassport("");
    setPhone("");
    setEmail("");
    setPartnerId(defaultPartnerId ?? "none");
    setExam(EMPTY_EXAM_RECORD_DRAFT);
  }

  async function handleSubmit() {
    if (duplicate.length > 0) {
      toast.error(t("students.duplicateErrorToast"));
      return;
    }
    if (!firstName.trim() || !lastName.trim() || !passport.trim()) {
      toast.error(t("students.requiredFieldsToast"));
      return;
    }

    setSaving(true);
    try {
      const created = await addStudent({
        firstName: firstName.trim(),
        middleName: middleName.trim() || undefined,
        lastName: lastName.trim(),
        passportNumber: passport.trim().toUpperCase(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        partnerId: partnerId === "none" ? null : partnerId,
        examRecord: exam.programId
          ? {
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
            }
          : undefined,
      });

      toast.success(t("students.addedToast", fullName(created)));
      reset();
      setOpen(false);
    } catch {
      toast.error(t("students.saveFailedToast"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger render={<Button className="gap-2" />}>
        <Plus className="size-4" />
        {t("students.add")}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("students.newStudent")}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label>{t("students.firstname")}</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("students.middlename")}</Label>
              <Input value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("students.lastname")}</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>{t("students.passport")}</Label>
              <Input
                value={passport}
                onChange={(e) => setPassport(e.target.value.toUpperCase())}
                placeholder="AB1234567"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("students.phone")}</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label>{t("students.email")}</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
              />
            </div>
          </div>

          {duplicate.length > 0 && (
            <div className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-amber-800">
                <AlertTriangle className="size-4" />
                {t("students.duplicateWarning")}
              </div>
              {duplicate.slice(0, 3).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    onOpenExisting(s);
                    setOpen(false);
                  }}
                  className="flex items-center justify-between rounded-md bg-white px-2.5 py-1.5 text-left text-xs hover:bg-amber-100"
                >
                  <span className="font-medium">{fullName(s)}</span>
                  <span className="text-muted-foreground">{s.passportNumber} · {t("students.openArrow")}</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>{t("students.partner")}</Label>
            <Select
              value={partnerId}
              onValueChange={(v) => setPartnerId(v ?? "none")}
              items={{
                none: t("common.noPartner"),
                ...Object.fromEntries(partners.map((p) => [p.id, `${p.name} (${p.code})`])),
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("common.noPartner")}</SelectItem>
                {partners.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ExamRecordForm value={exam} onChange={setExam} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={duplicate.length > 0 || saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
