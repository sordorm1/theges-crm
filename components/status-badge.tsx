import { cn } from "@/lib/utils";
import type { ExamStatus } from "@/lib/types";

const CONFIG: Record<ExamStatus, { label: string; className: string }> = {
  passed: {
    label: "Сдал",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  failed: {
    label: "Не сдал",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  scheduled: {
    label: "Запланирован",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
};

export function StatusBadge({ status }: { status: ExamStatus }) {
  const c = CONFIG[status];
  return (
    <span
      className={cn(
        "shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap",
        c.className,
      )}
    >
      {c.label}
    </span>
  );
}
