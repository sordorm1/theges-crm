"use client";

import { cn } from "@/lib/utils";
import type { ExamStatus } from "@/lib/types";
import { useTranslation } from "@/lib/i18n/context";

const CLASSNAMES: Record<ExamStatus, string> = {
  passed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  scheduled: "bg-blue-50 text-blue-700 border-blue-200",
};

export function StatusBadge({ status }: { status: ExamStatus }) {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        "shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap",
        CLASSNAMES[status],
      )}
    >
      {t(`status.${status}`)}
    </span>
  );
}
