"use client";

import { useMemo, useState } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAppData } from "@/lib/data/store-context";
import { StudentsTable } from "@/components/students/students-table";
import { StudentDetailSheet } from "@/components/students/student-detail-sheet";
import type { ExamStatus } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ExamProgramPage() {
  const params = useParams<{ programId: string }>();
  const { students, partners, examPrograms } = useAppData();
  const program = examPrograms.find((p) => p.key === params.programId);

  const [partnerFilter, setPartnerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<ExamStatus | "all">("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const selected = selectedId ? (students.find((s) => s.id === selectedId) ?? null) : null;

  const programStudents = useMemo(() => {
    if (!program) return [];
    return students
      .filter((s) => s.examRecords.some((r) => r.examProgramId === program.id))
      .filter((s) => partnerFilter === "all" || s.partnerId === partnerFilter)
      .filter((s) => {
        const record = s.examRecords.find((r) => r.examProgramId === program.id);
        if (!record) return false;
        if (statusFilter !== "all" && record.status !== statusFilter) return false;
        if (from && new Date(record.date) < new Date(from)) return false;
        if (to && new Date(record.date) > new Date(to)) return false;
        return true;
      })
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [students, program, partnerFilter, statusFilter, from, to]);

  if (!program) return notFound();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div>
        <Link
          href="/exams"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Все экзамены
        </Link>
        <div className="flex items-center gap-3">
          <span
            className="flex size-11 items-center justify-center rounded-xl text-lg font-bold"
            style={{ backgroundColor: `${program.color}1a`, color: program.color }}
          >
            {program.shortName.slice(0, 2)}
          </span>
          <div>
            <h1 className="text-2xl font-bold">{program.name}</h1>
            <p className="text-sm text-muted-foreground">
              {programStudents.length} учеников
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Партнёр</Label>
          <Select
            value={partnerFilter}
            onValueChange={(v) => setPartnerFilter(v ?? "all")}
            items={{
              all: "Все партнёры",
              ...Object.fromEntries(partners.map((p) => [p.id, p.name])),
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все партнёры</SelectItem>
              {partners.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Статус</Label>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter((v ?? "all") as ExamStatus | "all")}
            items={{
              all: "Любой",
              scheduled: "Запланирован",
              passed: "Сдал",
              failed: "Не сдал",
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Любой</SelectItem>
              <SelectItem value="scheduled">Запланирован</SelectItem>
              <SelectItem value="passed">Сдал</SelectItem>
              <SelectItem value="failed">Не сдал</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">С даты</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">По дату</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
        </div>
      </div>

      <StudentsTable
        students={programStudents}
        partners={partners}
        programId={program.id}
        onOpen={(s) => {
          setSelectedId(s.id);
          setDetailOpen(true);
        }}
      />

      <StudentDetailSheet student={selected} open={detailOpen} onOpenChange={setDetailOpen} />
    </div>
  );
}
