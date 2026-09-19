"use client";

import { motion } from "framer-motion";
import { Users, TrendingUp, Award, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { pluralizeStudents } from "@/lib/format";
import { useTranslation } from "@/lib/i18n/context";

interface Kpi {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  accent: string;
}

export function KpiCards({
  total,
  thisMonth,
  topPartnerName,
  topPartnerCount,
  topProgramName,
  topProgramCount,
}: {
  total: number;
  thisMonth: number;
  topPartnerName: string;
  topPartnerCount: number;
  topProgramName: string;
  topProgramCount: number;
}) {
  const { t, locale } = useTranslation();

  const kpis: Kpi[] = [
    {
      label: t("dashboard.kpi.totalStudents"),
      value: String(total),
      sub: t("dashboard.kpi.allTime"),
      icon: Users,
      accent: "text-blue-600 bg-blue-50",
    },
    {
      label: t("dashboard.kpi.newThisMonth"),
      value: String(thisMonth),
      sub: t("dashboard.kpi.thisMonth"),
      icon: TrendingUp,
      accent: "text-emerald-600 bg-emerald-50",
    },
    {
      label: t("dashboard.kpi.topPartner"),
      value: topPartnerName || "—",
      sub: topPartnerName
        ? `${pluralizeStudents(topPartnerCount, locale)} ${t("dashboard.kpi.broughtStudents")}`
        : t("dashboard.kpi.noData"),
      icon: Award,
      accent: "text-amber-600 bg-amber-50",
    },
    {
      label: t("dashboard.kpi.topProgram"),
      value: topProgramName || "—",
      sub: topProgramName ? pluralizeStudents(topProgramCount, locale) : t("dashboard.kpi.noData"),
      icon: Target,
      accent: "text-violet-600 bg-violet-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi, i) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.35, ease: "easeOut" }}
          className="rounded-2xl border border-border bg-card p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              {kpi.label}
            </span>
            <span className={cn("flex size-9 items-center justify-center rounded-xl", kpi.accent)}>
              <kpi.icon className="size-4.5" strokeWidth={2.2} />
            </span>
          </div>
          <div className="mt-3 truncate text-2xl font-bold" title={kpi.value}>
            {kpi.value}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{kpi.sub}</div>
        </motion.div>
      ))}
    </div>
  );
}
