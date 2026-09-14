"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Folder, Users, Settings2 } from "lucide-react";
import { useAppData } from "@/lib/data/store-context";
import { subjectLabels } from "@/lib/data/programs";
import { Button } from "@/components/ui/button";

export default function ExamsPage() {
  const { students, examPrograms, subjects } = useAppData();
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
          <h1 className="text-2xl font-bold">Экзамены</h1>
          <p className="text-sm text-muted-foreground">
            Программы подготовки · {examPrograms.length} направлений
          </p>
        </div>
        <Button variant="outline" className="gap-2" render={<Link href="/settings" />}>
          <Settings2 className="size-4" />
          Добавить направление / экзамен
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {examPrograms.map((program, i) => (
          <motion.div
            key={program.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          >
            <Link
              href={`/exams/${program.key}`}
              className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span
                  className="flex size-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${program.color}1a`, color: program.color }}
                >
                  <Folder className="size-6" strokeWidth={2} />
                </span>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground">
                  {labels[program.subject] ?? program.subject}
                </span>
              </div>
              <div>
                <h3 className="text-base font-semibold group-hover:text-primary">
                  {program.name}
                </h3>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="size-3.5" />
                  {counts.get(program.id) ?? 0} учеников
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
        {examPrograms.length === 0 && (
          <p className="text-sm text-muted-foreground">Пока нет программ экзаменов</p>
        )}
      </div>
    </div>
  );
}
