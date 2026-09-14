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

export interface ExamRecordDraft {
  subjectKey: string;
  programId: string;
  date: string;
  status: ExamStatus;
  levelLabel: string;
  login: string;
  password: string;
  examKey: string;
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
};

export function ExamRecordForm({
  value,
  onChange,
}: {
  value: ExamRecordDraft;
  onChange: (v: ExamRecordDraft) => void;
}) {
  const { subjects, examPrograms, subjectLevels } = useAppData();
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
          <Label>Направление</Label>
          <Select
            value={value.subjectKey}
            onValueChange={(v) => patch({ subjectKey: v ?? "", programId: "", levelLabel: "" })}
            items={labels}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Выберите направление" />
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
          <Label>Экзамен / программа</Label>
          <Select
            value={value.programId}
            onValueChange={(v) => patch({ programId: v ?? "" })}
            disabled={!value.subjectKey}
            items={Object.fromEntries(availablePrograms.map((p) => [p.id, p.name]))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Выберите экзамен" />
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
          <Label>Дата</Label>
          <Input type="date" value={value.date} onChange={(e) => patch({ date: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Статус</Label>
          <Select
            value={value.status}
            onValueChange={(v) => patch({ status: (v ?? "scheduled") as ExamStatus })}
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
          <Select
            value={value.levelLabel}
            onValueChange={(v) => patch({ levelLabel: v ?? "" })}
            disabled={availableLevels.length === 0}
            items={Object.fromEntries(availableLevels.map((l) => [l.label, l.label]))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={availableLevels.length ? "Выберите уровень" : "Нет уровней"} />
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
        Логин, пароль и exam key вводятся вручную — так, как их выдали ученику в тестовом центре.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label>Логин</Label>
          <Input value={value.login} onChange={(e) => patch({ login: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Пароль</Label>
          <Input
            value={value.password}
            onChange={(e) => patch({ password: e.target.value })}
            className="font-mono"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Exam Key</Label>
          <Input
            value={value.examKey}
            onChange={(e) => patch({ examKey: e.target.value })}
            className="font-mono"
          />
        </div>
      </div>
    </div>
  );
}
