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
import type { DashboardFilters, Partner } from "@/lib/types";
import { SUBJECT_LABELS } from "@/lib/data/programs";

const EMPTY_FILTERS: DashboardFilters = {
  from: undefined,
  to: undefined,
  partnerId: "all",
  subject: "all",
  status: "all",
};

export function FilterSheet({
  partners,
  filters,
  onApply,
}: {
  partners: Partner[];
  filters: DashboardFilters;
  onApply: (filters: DashboardFilters) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DashboardFilters>(filters);

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
        Фильтры
        {activeCount > 0 && (
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
            {activeCount}
          </span>
        )}
      </Button>

      <SheetContent side="right" className="w-full sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Фильтры дашборда</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="from">С даты</Label>
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
              <Label htmlFor="to">По дату</Label>
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
            <Label>Партнёр</Label>
            <Select
              value={draft.partnerId ?? "all"}
              onValueChange={(v) => setDraft((d) => ({ ...d, partnerId: v ?? "all" }))}
              items={{
                all: "Все партнёры",
                ...Object.fromEntries(partners.map((p) => [p.id, p.name])),
              }}
            >
              <SelectTrigger className="w-full">
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
            <Label>Направление</Label>
            <Select
              value={draft.subject ?? "all"}
              onValueChange={(v) =>
                setDraft((d) => ({ ...d, subject: (v ?? "all") as DashboardFilters["subject"] }))
              }
              items={{ all: "Все направления", ...SUBJECT_LABELS }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все направления</SelectItem>
                {Object.entries(SUBJECT_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Статус экзамена</Label>
            <Select
              value={draft.status ?? "all"}
              onValueChange={(v) =>
                setDraft((d) => ({ ...d, status: (v ?? "all") as DashboardFilters["status"] }))
              }
              items={{
                all: "Любой статус",
                scheduled: "Запланирован",
                passed: "Сдал",
                failed: "Не сдал",
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Любой статус</SelectItem>
                <SelectItem value="scheduled">Запланирован</SelectItem>
                <SelectItem value="passed">Сдал</SelectItem>
                <SelectItem value="failed">Не сдал</SelectItem>
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
            Сбросить
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              onApply(draft);
              setOpen(false);
            }}
          >
            Применить
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
