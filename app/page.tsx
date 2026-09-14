"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAppData } from "@/lib/data/store-context";
import {
  applyFilters,
  currentMonthCount,
  monthlyEnrollment,
  partnerRanking,
  programPopularity,
  passRate as computePassRate,
} from "@/lib/stats";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { MonthlyChart } from "@/components/dashboard/monthly-chart";
import { ProgramChart } from "@/components/dashboard/program-chart";
import { PartnerRanking } from "@/components/dashboard/partner-ranking";
import { FilterSheet } from "@/components/dashboard/filter-sheet";
import type { DashboardFilters } from "@/lib/types";
import { formatDate, fullName } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";

export default function DashboardPage() {
  const { students, partners } = useAppData();
  const [filters, setFilters] = useState<DashboardFilters>({
    partnerId: "all",
    subject: "all",
    status: "all",
  });

  const filtered = useMemo(() => applyFilters(students, filters), [students, filters]);

  const monthly = useMemo(() => monthlyEnrollment(filtered), [filtered]);
  const ranking = useMemo(() => partnerRanking(filtered, partners), [filtered, partners]);
  const programs = useMemo(() => programPopularity(filtered), [filtered]);
  const thisMonth = useMemo(() => currentMonthCount(filtered), [filtered]);
  const rate = useMemo(() => computePassRate(filtered), [filtered]);
  const recent = useMemo(() => filtered.slice(0, 6), [filtered]);

  const topPartner = ranking[0];
  const topProgram = programs[0];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Дашборд</h1>
          <p className="text-sm text-muted-foreground">
            Обзор набора учеников, партнёров и курсов
          </p>
        </div>
        <FilterSheet partners={partners} filters={filters} onApply={setFilters} />
      </div>

      <KpiCards
        total={filtered.length}
        thisMonth={thisMonth}
        topPartnerName={topPartner?.count ? topPartner.partner.name : "—"}
        topProgramName={topProgram?.count ? topProgram.program.shortName : "—"}
        passRate={rate}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <MonthlyChart data={monthly} />
        </div>
        <PartnerRanking ranking={ranking} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Последние ученики</h3>
              <p className="text-xs text-muted-foreground">
                недавно зарегистрированные
              </p>
            </div>
            <Link
              href="/students"
              className="text-xs font-medium text-primary hover:underline"
            >
              Все ученики →
            </Link>
          </div>
          <div className="flex flex-col divide-y divide-border">
            {recent.map((s) => {
              const partner = partners.find((p) => p.id === s.partnerId);
              const lastExam = s.examRecords[s.examRecords.length - 1];
              return (
                <div key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{fullName(s)}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {partner?.name ?? "Без партнёра"} · {formatDate(s.createdAt)}
                    </div>
                  </div>
                  {lastExam && <StatusBadge status={lastExam.status} />}
                </div>
              );
            })}
            {recent.length === 0 && (
              <p className="py-4 text-sm text-muted-foreground">Нет учеников по фильтру</p>
            )}
          </div>
        </div>
        <ProgramChart data={programs} />
      </div>
    </div>
  );
}
