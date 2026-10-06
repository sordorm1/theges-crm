"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Clock, Loader2, ThumbsDown, ThumbsUp, X } from "lucide-react";
import type { ExamRecord, ExamStatus } from "@/lib/types";
import { useAppData } from "@/lib/data/store-context";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export const EXAM_STATUS_OPTIONS: { value: ExamStatus; icon: typeof Clock }[] = [
  { value: "scheduled", icon: Clock },
  { value: "passed", icon: Check },
  { value: "failed", icon: X },
];

const STATUS_ACTIVE_CLASSNAMES: Record<ExamStatus, string> = {
  scheduled: "bg-blue-600 text-white shadow-sm",
  passed: "bg-emerald-600 text-white shadow-sm",
  failed: "bg-red-600 text-white shadow-sm",
};

function pillClasses(size: "default" | "sm") {
  return size === "sm" ? "px-2 py-1 text-[11px]" : "px-2.5 py-1.5 text-xs";
}

function iconClasses(size: "default" | "sm") {
  return size === "sm" ? "size-3" : "size-3.5";
}

/** Pure, controlled status buttons — shared by draft forms (add student / add exam) and the live quick-switch below, so status is always marked the same clear way. */
export function StatusButtons({
  value,
  onChange,
  pending,
  disabled,
  size = "default",
}: {
  value: ExamStatus;
  onChange: (v: ExamStatus) => void;
  pending?: ExamStatus | null;
  disabled?: boolean;
  size?: "default" | "sm";
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-1 rounded-full bg-muted p-1">
      {EXAM_STATUS_OPTIONS.map(({ value: v, icon: Icon }) => {
        const active = value === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            disabled={disabled}
            className={cn(
              "flex items-center gap-1.5 rounded-full font-semibold transition-colors disabled:opacity-60",
              pillClasses(size),
              active ? STATUS_ACTIVE_CLASSNAMES[v] : "text-muted-foreground hover:bg-background",
            )}
          >
            {pending === v ? (
              <Loader2 className={cn(iconClasses(size), "animate-spin")} />
            ) : (
              <Icon className={iconClasses(size)} />
            )}
            {t(`status.${v}`)}
          </button>
        );
      })}
    </div>
  );
}

/** One-tap status switch for an existing exam record — saves immediately, no edit form needed. */
export function StatusQuickSwitch({ record, size }: { record: ExamRecord; size?: "default" | "sm" }) {
  const { updateExamRecord } = useAppData();
  const { t } = useTranslation();
  const [pending, setPending] = useState<ExamStatus | null>(null);

  async function handlePick(value: ExamStatus) {
    if (value === record.status || pending) return;
    setPending(value);
    try {
      await updateExamRecord(record.id, {
        date: record.date,
        status: value,
        result: record.result ?? null,
        levelLabel: record.levelLabel,
        login: record.login,
        password: record.password,
        examKey: record.examKey,
      });
      toast.success(t("studentDetail.statusChangedToast"));
    } catch {
      toast.error(t("studentDetail.saveFailedToast"));
    } finally {
      setPending(null);
    }
  }

  return (
    <StatusButtons
      value={record.status}
      onChange={handlePick}
      pending={pending}
      disabled={pending !== null}
      size={size}
    />
  );
}

/**
 * Pure, controlled result pill. Starts neutral (null, "Natija" — nothing
 * decided yet, deliberately NOT pre-set to either answer so it can't be
 * mistaken for a real confirmation). Tap cycles null/false -> true ("o'tdi")
 * -> false ("yiqildi") -> true, etc.
 */
export function ResultToggle({
  value,
  onChange,
  pending,
  disabled,
  size = "default",
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
  pending?: boolean;
  disabled?: boolean;
  size?: "default" | "sm";
}) {
  const { t } = useTranslation();
  const label = value === null ? t("studentDetail.resultUnset") : value ? t("studentDetail.resultOk") : t("studentDetail.resultFail");
  return (
    <button
      type="button"
      onClick={() => onChange(value === false ? true : value === null ? true : false)}
      disabled={disabled}
      className={cn(
        "flex items-center gap-1.5 rounded-full font-semibold transition-colors disabled:opacity-60",
        pillClasses(size),
        value === null
          ? "bg-muted text-muted-foreground"
          : value
            ? "bg-emerald-600 text-white shadow-sm"
            : "bg-red-600 text-white shadow-sm",
      )}
    >
      {pending ? (
        <Loader2 className={cn(iconClasses(size), "animate-spin")} />
      ) : value === null ? null : value ? (
        <ThumbsUp className={iconClasses(size)} />
      ) : (
        <ThumbsDown className={iconClasses(size)} />
      )}
      {label}
    </button>
  );
}

/** One-tap result switch for an existing exam record — saves immediately. Only meaningful once status === "passed". */
export function ResultQuickSwitch({ record, size }: { record: ExamRecord; size?: "default" | "sm" }) {
  const { updateExamRecord } = useAppData();
  const { t } = useTranslation();
  const [pending, setPending] = useState(false);

  async function handleToggle(value: boolean) {
    if (pending) return;
    setPending(true);
    try {
      await updateExamRecord(record.id, {
        date: record.date,
        status: record.status,
        result: value,
        levelLabel: record.levelLabel,
        login: record.login,
        password: record.password,
        examKey: record.examKey,
      });
      toast.success(t("studentDetail.resultChangedToast"));
    } catch {
      toast.error(t("studentDetail.saveFailedToast"));
    } finally {
      setPending(false);
    }
  }

  return (
    <ResultToggle value={record.result ?? null} onChange={handleToggle} pending={pending} disabled={pending} size={size} />
  );
}
