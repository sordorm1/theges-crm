"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Folder, Users, Settings2, Trash2, Loader2 } from "lucide-react";
import { useAppData } from "@/lib/data/store-context";
import { subjectLabels } from "@/lib/data/programs";
import { Button } from "@/components/ui/button";
import type { ExamProgram } from "@/lib/types";
import { useTranslation } from "@/lib/i18n/context";

function ProgramCard({
  program,
  label,
  count,
  index,
}: {
  program: ExamProgram;
  label: string;
  count: number;
  index: number;
}) {
  const { deleteExamProgram } = useAppData();
  const { t } = useTranslation();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(t("exams.deleteConfirm", program.name))) return;
    setDeleting(true);
    try {
      await deleteExamProgram(program.id);
      toast.success(t("exams.deletedToast"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("exams.deleteFailedToast"));
      setDeleting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.05, duration: 0.3 }}
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/exams/view?program=${program.key}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter") router.push(`/exams/view?program=${program.key}`);
      }}
      className="group flex cursor-pointer flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <span
          className="flex size-12 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${program.color}1a`, color: program.color }}
        >
          <Folder className="size-6" strokeWidth={2} />
        </span>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground">
            {label}
          </span>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            aria-label={t("exams.deleteAriaLabel")}
            className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
          </button>
        </div>
      </div>
      <div>
        <h3 className="text-base font-semibold group-hover:text-primary">{program.name}</h3>
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="size-3.5" />
          {count} {t("exams.studentsCount")}
        </div>
      </div>
    </motion.div>
  );
}

export default function ExamsPage() {
  const { students, examPrograms, subjects } = useAppData();
  const { t } = useTranslation();
  const labels = useMemo(() => subjectLabels(subjects), [subjects]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of students) {
      for (const r of s.examRecords) {
        map.set(r.examProgramId, (map.get(r.examProgramId) ?? 0) + 1);
      }
    }
    return map;
  }, [students]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("exams.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("exams.subtitle")} · {examPrograms.length} {t("exams.directionsCount")}
          </p>
        </div>
        <Button variant="outline" className="gap-2" render={<Link href="/settings" />}>
          <Settings2 className="size-4" />
          {t("exams.addDirection")}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {examPrograms.map((program, idx) => (
          <ProgramCard
            key={program.id}
            program={program}
            label={labels[program.subject] ?? program.subject}
            count={counts.get(program.id) ?? 0}
            index={idx}
          />
        ))}
        {examPrograms.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("exams.noPrograms")}</p>
        )}
      </div>
    </div>
  );
}
