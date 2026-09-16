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

function slugify(label: string) {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яё\s-]/gi, "")
    .replace(/\s+/g, "-");
}

function SubjectsCard() {
  const { subjects, addSubject, deleteSubject } = useAppData();
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleAdd() {
    if (!label.trim()) return;
    setSaving(true);
    try {
      await addSubject(slugify(label), label.trim());
      toast.success(`Направление «${label.trim()}» добавлено`);
      setLabel("");
    } catch {
      toast.error("Не удалось добавить направление");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Удалить направление «${name}»? Уровни этого направления тоже удалятся.`)) return;
    setDeletingId(id);
    try {
      await deleteSubject(id);
      toast.success("Направление удалено");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось удалить направление");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold">Направления</h3>
      <p className="mt-1 text-xs text-muted-foreground">Английский, Испанский, Арабский, Математика...</p>
      <div className="mt-4 flex flex-col gap-1.5">
        {subjects.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
            {s.label}
            <button
              type="button"
              onClick={() => handleDelete(s.id, s.label)}
              disabled={deletingId === s.id}
              className="text-muted-foreground hover:text-destructive"
              aria-label={`Удалить ${s.label}`}
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
          placeholder="Новое направление"
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
      toast.success(`Уровень «${label.trim()}» добавлен`);
      setLabel("");
    } catch {
      toast.error("Не удалось добавить уровень");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Удалить уровень «${name}»?`)) return;
    setDeletingId(id);
    try {
      await deleteSubjectLevel(id);
      toast.success("Уровень удалён");
    } catch {
      toast.error("Не удалось удалить уровень");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold">Уровни по направлениям</h3>
      <p className="mt-1 text-xs text-muted-foreground">Например, для английского: A1–C2</p>
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
                      aria-label={`Удалить уровень ${l.label}`}
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
            <SelectValue placeholder="Направление" />
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
          placeholder="Например, B2"
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
      toast.success(`Программа «${name.trim()}» добавлена`);
      setName("");
      setShortName("");
    } catch {
      toast.error("Не удалось добавить программу");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Удалить программу «${name}»?`)) return;
    setDeletingId(id);
    try {
      await deleteExamProgram(id);
      toast.success("Программа удалена");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось удалить программу");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold">Программы экзаменов</h3>
      <p className="mt-1 text-xs text-muted-foreground">IELTS, SAT, GRE и другие</p>
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
                      aria-label={`Удалить программу ${p.name}`}
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
            <SelectValue placeholder="Направление" />
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
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Название, напр. TOEFL" />
          <Input
            value={shortName}
            onChange={(e) => setShortName(e.target.value)}
            placeholder="Кратко"
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
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Настройки</h1>
        <p className="text-sm text-muted-foreground">
          Направления, уровни и программы экзаменов — используются во всех формах
        </p>
      </div>

      <SubjectsCard />
      <LevelsCard />
      <ExamProgramsCard />
    </div>
  );
}
