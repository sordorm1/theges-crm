"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DashboardFilters, Partner, SubjectRow } from "@/lib/types";
import { subjectLabels } from "@/lib/data/programs";
import { useTranslation } from "@/lib/i18n/context";

const EMPTY_FILTERS: DashboardFilters = {
  from: undefined,
  to: undefined,
  partnerId: "all",
  subject: "all",
  status: "all",
};

export function FilterSheet({
  partners,
  subjects,
  filters,
  onApply,
}: {
  partners: Partner[];
  subjects: SubjectRow[];
  filters: DashboardFilters;
  onApply: (filters: DashboardFilters) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DashboardFilters>(filters);
  const labels = subjectLabels(subjects);

  const activeCount = Object.entries(filters).filter(
    ([, v]) => v && v !== "all",
  ).length;

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setDraft(filters);
      }}
    >
      <Button
        variant="outline"
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        <SlidersHorizontal className="size-4" />
        {t("dashboard.filters.button")}
        {activeCount > 0 && (
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
            {activeCount}
          </span>
        )}
      </Button>

      <SheetContent side="right" className="w-full sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>{t("dashboard.filters.title")}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="from">{t("dashboard.filters.from")}</Label>
              <Input
                id="from"
                type="date"
                value={draft.from ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, from: e.target.value || undefined }))
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="to">{t("dashboard.filters.to")}</Label>
              <Input
                id="to"
                type="date"
                value={draft.to ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, to: e.target.value || undefined }))
                }
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t("dashboard.filters.partner")}</Label>
            <Select
              value={draft.partnerId ?? "all"}
              onValueChange={(v) => setDraft((d) => ({ ...d, partnerId: v ?? "all" }))}
              items={{
                all: t("dashboard.filters.allPartners"),
                ...Object.fromEntries(partners.map((p) => [p.id, p.name])),
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("dashboard.filters.allPartners")}</SelectItem>
                {partners.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t("dashboard.filters.direction")}</Label>
            <Select
              value={draft.subject ?? "all"}
              onValueChange={(v) =>
                setDraft((d) => ({ ...d, subject: (v ?? "all") as DashboardFilters["subject"] }))
              }
              items={{ all: t("dashboard.filters.allDirections"), ...labels }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("dashboard.filters.allDirections")}</SelectItem>
                {Object.entries(labels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t("dashboard.filters.status")}</Label>
            <Select
              value={draft.status ?? "all"}
              onValueChange={(v) =>
                setDraft((d) => ({ ...d, status: (v ?? "all") as DashboardFilters["status"] }))
              }
              items={{
                all: t("dashboard.filters.anyStatus"),
                scheduled: t("status.scheduled"),
                passed: t("status.passed"),
                failed: t("status.failed"),
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("dashboard.filters.anyStatus")}</SelectItem>
                <SelectItem value="scheduled">{t("status.scheduled")}</SelectItem>
                <SelectItem value="passed">{t("status.passed")}</SelectItem>
                <SelectItem value="failed">{t("status.failed")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <SheetFooter className="flex-row gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              setDraft(EMPTY_FILTERS);
              onApply(EMPTY_FILTERS);
              setOpen(false);
            }}
          >
            {t("dashboard.filters.reset")}
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              onApply(draft);
              setOpen(false);
            }}
          >
            {t("dashboard.filters.apply")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
