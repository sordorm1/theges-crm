"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Check, X, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PinDialog } from "@/components/pin-dialog";
import { useAppData } from "@/lib/data/store-context";
import { formatUsd, formatTashkentDateTime } from "@/lib/format";
import type { ExamRecord } from "@/lib/types";
import type { FeeField } from "@/lib/api/payments";

const FEE_FIELDS: { field: FeeField; label: string }[] = [
  { field: "registrationFeeUsd", label: "Регистрация" },
  { field: "examFeeUsd", label: "Экзамен" },
  { field: "consultationFeeUsd", label: "Консультация" },
];

function FeeRow({ examRecord, field, label }: { examRecord: ExamRecord; field: FeeField; label: string }) {
  const { updateExamFee } = useAppData();
  const currentValue = examRecord[field];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(currentValue !== undefined ? String(currentValue) : "");
  const [pinOpen, setPinOpen] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [pendingValue, setPendingValue] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(value: number, pin?: string) {
    setSaving(true);
    try {
      const result = await updateExamFee(examRecord.id, field, value, pin);
      if (result.ok) {
        toast.success(`${label}: сохранено`);
        setEditing(false);
        setPinOpen(false);
        setPinError(null);
        return;
      }
      if (result.error === "PIN_REQUIRED") {
        setPendingValue(value);
        setPinOpen(true);
        return;
      }
      if (result.error === "PIN_INVALID") {
        setPinError("Неверный код");
        return;
      }
      toast.error("Не удалось сохранить сумму");
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit() {
    const value = Number(draft.replace(",", "."));
    if (Number.isNaN(value) || value < 0) {
      toast.error("Введите корректную сумму");
      return;
    }
    save(value);
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-lg bg-muted px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </span>
        {!editing && (
          <Button
            variant="ghost"
            size="icon"
            className="size-6 shrink-0"
            onClick={() => {
              setDraft(currentValue !== undefined ? String(currentValue) : "");
              setEditing(true);
            }}
          >
            <Pencil className="size-3.5" />
          </Button>
        )}
      </div>

      {editing ? (
        <div className="flex items-center gap-1">
          <Input
            autoFocus
            inputMode="decimal"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
              if (e.key === "Escape") setEditing(false);
            }}
            disabled={saving}
            className="h-8 min-w-0 flex-1 font-mono text-sm"
            placeholder="0"
          />
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            disabled={saving}
            onClick={handleSubmit}
          >
            <Check className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            disabled={saving}
            onClick={() => setEditing(false)}
          >
            <X className="size-3.5" />
          </Button>
        </div>
      ) : (
        <div className="font-mono text-sm font-medium">{formatUsd(currentValue)}</div>
      )}

      <PinDialog
        open={pinOpen}
        onOpenChange={(o) => {
          setPinOpen(o);
          if (!o) setPinError(null);
        }}
        error={pinError}
        onConfirm={(pin) => {
          if (pendingValue !== null) save(pendingValue, pin);
        }}
      />
    </div>
  );
}

export function PaymentSection({ examRecord }: { examRecord: ExamRecord }) {
  const { addPaymentComment } = useAppData();
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleAddComment() {
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await addPaymentComment(examRecord.id, comment.trim());
      setComment("");
    } catch {
      toast.error("Не удалось добавить комментарий");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card/50 p-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold">
        Оплата
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {FEE_FIELDS.map(({ field, label }) => (
          <FeeRow key={field} examRecord={examRecord} field={field} label={label} />
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <MessageSquare className="size-3.5" />
          Комментарии по оплате
        </div>
        <div className="flex flex-col gap-1.5">
          {(examRecord.paymentComments ?? []).map((c) => (
            <div key={c.id} className="rounded-lg bg-muted px-3 py-2 text-sm">
              <div className="break-words">{c.text}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {formatTashkentDateTime(c.createdAt)} (Ташкент)
              </div>
            </div>
          ))}
          {(examRecord.paymentComments ?? []).length === 0 && (
            <p className="text-xs text-muted-foreground">Комментариев пока нет</p>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Например: оплатил наличными 50%..."
            className="min-h-16 flex-1 text-sm"
          />
          <Button
            size="sm"
            className="self-start sm:self-end"
            disabled={!comment.trim() || submitting}
            onClick={handleAddComment}
          >
            Добавить
          </Button>
        </div>
      </div>
    </div>
  );
}
