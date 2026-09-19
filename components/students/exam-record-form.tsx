"use client";

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
import { programsForSubject, subjectLabels } from "@/lib/data/programs";
import type { ExamStatus } from "@/lib/types";
import { useTranslation } from "@/lib/i18n/context";

export interface ExamRecordDraft {
  subjectKey: string;
  programId: string;
  date: string;
  status: ExamStatus;
  levelLabel: string;
  login: string;
  password: string;
  examKey: string;
  registrationFeeUsd: string;
  examFeeUsd: string;
  consultationFeeUsd: string;
}

export const EMPTY_EXAM_RECORD_DRAFT: ExamRecordDraft = {
  subjectKey: "",
  programId: "",
  date: "",
  status: "scheduled",
  levelLabel: "",
  login: "",
  password: "",
  examKey: "",
  registrationFeeUsd: "",
  examFeeUsd: "",
  consultationFeeUsd: "",
};

export function ExamRecordForm({
  value,
  onChange,
}: {
  value: ExamRecordDraft;
  onChange: (v: ExamRecordDraft) => void;
}) {
  const { subjects, examPrograms, subjectLevels } = useAppData();
  const { t } = useTranslation();
  const labels = subjectLabels(subjects);
  const availablePrograms = value.subjectKey ? programsForSubject(examPrograms, value.subjectKey) : [];
  const subject = subjects.find((s) => s.key === value.subjectKey);
  const availableLevels = subject
    ? subjectLevels.filter((l) => l.subjectId === subject.id)
    : [];

  function patch(partial: Partial<ExamRecordDraft>) {
    onChange({ ...value, ...partial });
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>{t("examForm.direction")}</Label>
          <Select
            value={value.subjectKey}
            onValueChange={(v) => patch({ subjectKey: v ?? "", programId: "", levelLabel: "" })}
            items={labels}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("examForm.selectDirection")} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(labels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>{t("examForm.examProgram")}</Label>
          <Select
            value={value.programId}
            onValueChange={(v) => patch({ programId: v ?? "" })}
            disabled={!value.subjectKey}
            items={Object.fromEntries(availablePrograms.map((p) => [p.id, p.name]))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("examForm.selectExam")} />
            </SelectTrigger>
            <SelectContent>
              {availablePrograms.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label>{t("examForm.date")}</Label>
          <Input type="date" value={value.date} onChange={(e) => patch({ date: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>{t("examForm.status")}</Label>
          <Select
            value={value.status}
            onValueChange={(v) => patch({ status: (v ?? "scheduled") as ExamStatus })}
            items={{ scheduled: t("status.scheduled"), passed: t("status.passed"), failed: t("status.failed") }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">{t("status.scheduled")}</SelectItem>
              <SelectItem value="passed">{t("status.passed")}</SelectItem>
              <SelectItem value="failed">{t("status.failed")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>{t("examForm.level")}</Label>
          <Select
            value={value.levelLabel}
            onValueChange={(v) => patch({ levelLabel: v ?? "" })}
            disabled={availableLevels.length === 0}
            items={Object.fromEntries(availableLevels.map((l) => [l.label, l.label]))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={availableLevels.length ? t("examForm.selectLevel") : t("examForm.noLevels")} />
            </SelectTrigger>
            <SelectContent>
              {availableLevels.map((l) => (
                <SelectItem key={l.id} value={l.label}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {t("examForm.loginHint")}
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label>{t("examForm.login")}</Label>
          <Input value={value.login} onChange={(e) => patch({ login: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>{t("examForm.password")}</Label>
          <Input
            value={value.password}
            onChange={(e) => patch({ password: e.target.value })}
            className="font-mono"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>{t("examForm.examKey")}</Label>
          <Input
            value={value.examKey}
            onChange={(e) => patch({ examKey: e.target.value })}
            className="font-mono"
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {t("examForm.feesHint")}
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label>{t("examForm.registration")}</Label>
          <Input
            inputMode="decimal"
            value={value.registrationFeeUsd}
            onChange={(e) => patch({ registrationFeeUsd: e.target.value })}
            placeholder="0"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>{t("examForm.exam")}</Label>
          <Input
            inputMode="decimal"
            value={value.examFeeUsd}
            onChange={(e) => patch({ examFeeUsd: e.target.value })}
            placeholder="0"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>{t("examForm.consultation")}</Label>
          <Input
            inputMode="decimal"
            value={value.consultationFeeUsd}
            onChange={(e) => patch({ consultationFeeUsd: e.target.value })}
            placeholder="0"
          />
        </div>
      </div>
    </div>
  );
}
