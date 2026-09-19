"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Loader2, X } from "lucide-react";
import { useAppData } from "@/lib/data/store-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { programsForSubject } from "@/lib/data/programs";
import { useTranslation } from "@/lib/i18n/context";

function slugify(label: string) {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яё\s-]/gi, "")
    .replace(/\s+/g, "-");
}

function SubjectsCard() {
  const { subjects, addSubject, deleteSubject } = useAppData();
  const { t } = useTranslation();
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleAdd() {
    if (!label.trim()) return;
    setSaving(true);
    try {
      await addSubject(slugify(label), label.trim());
      toast.success(t("settings.subjects.addedToast", label.trim()));
      setLabel("");
    } catch {
      toast.error(t("settings.subjects.addFailedToast"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(t("settings.subjects.deleteConfirm", name))) return;
    setDeletingId(id);
    try {
      await deleteSubject(id);
      toast.success(t("settings.subjects.deletedToast"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("settings.subjects.deleteFailedToast"));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold">{t("settings.subjects.title")}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{t("settings.subjects.subtitle")}</p>
      <div className="mt-4 flex flex-col gap-1.5">
        {subjects.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
            {s.label}
            <button
              type="button"
              onClick={() => handleDelete(s.id, s.label)}
              disabled={deletingId === s.id}
              className="text-muted-foreground hover:text-destructive"
              aria-label={t("settings.subjects.deleteAriaLabel", s.label)}
            >
              {deletingId === s.id ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
            </button>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={t("settings.subjects.placeholder")}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button onClick={handleAdd} disabled={!label.trim() || saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        </Button>
      </div>
    </div>
  );
}

function LevelsCard() {
  const { subjects, subjectLevels, addSubjectLevel, deleteSubjectLevel } = useAppData();
  const { t } = useTranslation();
  const [subjectId, setSubjectId] = useState("");
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const labels = Object.fromEntries(subjects.map((s) => [s.id, s.label]));

  async function handleAdd() {
    if (!subjectId || !label.trim()) return;
    setSaving(true);
    try {
      await addSubjectLevel(subjectId, label.trim());
      toast.success(t("settings.levels.addedToast", label.trim()));
      setLabel("");
    } catch {
      toast.error(t("settings.levels.addFailedToast"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(t("settings.levels.deleteConfirm", name))) return;
    setDeletingId(id);
    try {
      await deleteSubjectLevel(id);
      toast.success(t("settings.levels.deletedToast"));
    } catch {
      toast.error(t("settings.levels.deleteFailedToast"));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold">{t("settings.levels.title")}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{t("settings.levels.subtitle")}</p>
      <div className="mt-4 flex flex-col gap-3">
        {subjects.map((s) => {
          const levels = subjectLevels.filter((l) => l.subjectId === s.id);
          if (levels.length === 0) return null;
          return (
            <div key={s.id}>
              <div className="text-xs font-medium text-muted-foreground">{s.label}</div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {levels.map((l) => (
                  <span
                    key={l.id}
                    className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs"
                  >
                    {l.label}
                    <button
                      type="button"
                      onClick={() => handleDelete(l.id, l.label)}
                      disabled={deletingId === l.id}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={t("settings.levels.deleteAriaLabel", l.label)}
                    >
                      {deletingId === l.id ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <X className="size-3" />
                      )}
                    </button>
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Select value={subjectId} onValueChange={(v) => setSubjectId(v ?? "")} items={labels}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={t("settings.levels.directionPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={t("settings.levels.placeholder")}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button onClick={handleAdd} disabled={!subjectId || !label.trim() || saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        </Button>
      </div>
    </div>
  );
}

function ExamProgramsCard() {
  const { subjects, examPrograms, addExamProgram, deleteExamProgram } = useAppData();
  const { t } = useTranslation();
  const [subjectId, setSubjectId] = useState("");
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const labels = Object.fromEntries(subjects.map((s) => [s.id, s.label]));

  async function handleAdd() {
    if (!subjectId || !name.trim()) return;
    setSaving(true);
    try {
      await addExamProgram(subjectId, slugify(name), name.trim(), shortName.trim() || name.trim(), "#1e5fbf");
      toast.success(t("settings.programs.addedToast", name.trim()));
      setName("");
      setShortName("");
    } catch {
      toast.error(t("settings.programs.addFailedToast"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(t("settings.programs.deleteConfirm", name))) return;
    setDeletingId(id);
    try {
      await deleteExamProgram(id);
      toast.success(t("settings.programs.deletedToast"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("settings.programs.deleteFailedToast"));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold">{t("settings.programs.title")}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{t("settings.programs.subtitle")}</p>
      <div className="mt-4 flex flex-col gap-3">
        {subjects.map((s) => {
          const programs = programsForSubject(examPrograms, s.key);
          if (programs.length === 0) return null;
          return (
            <div key={s.id}>
              <div className="text-xs font-medium text-muted-foreground">{s.label}</div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {programs.map((p) => (
                  <span
                    key={p.id}
                    className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs"
                  >
                    {p.name}
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id, p.name)}
                      disabled={deletingId === p.id}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={t("settings.programs.deleteAriaLabel", p.name)}
                    >
                      {deletingId === p.id ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <X className="size-3" />
                      )}
                    </button>
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <Select value={subjectId} onValueChange={(v) => setSubjectId(v ?? "")} items={labels}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("settings.programs.directionPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("settings.programs.namePlaceholder")} />
          <Input
            value={shortName}
            onChange={(e) => setShortName(e.target.value)}
            placeholder={t("settings.programs.shortNamePlaceholder")}
            className="w-28"
          />
          <Button onClick={handleAdd} disabled={!subjectId || !name.trim() || saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("settings.subtitle")}
        </p>
      </div>

      <SubjectsCard />
      <LevelsCard />
      <ExamProgramsCard />
    </div>
  );
}
