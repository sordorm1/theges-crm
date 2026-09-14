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

  async function save(value: number, pin?: string) {
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
    <div className="flex items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {editing ? (
        <div className="flex items-center gap-1">
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
              if (e.key === "Escape") setEditing(false);
            }}
            className="h-7 w-24 text-right font-mono text-sm"
            placeholder="0"
          />
          <Button variant="ghost" size="icon" className="size-6" onClick={handleSubmit}>
            <Check className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="size-6" onClick={() => setEditing(false)}>
            <X className="size-3.5" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setDraft(currentValue !== undefined ? String(currentValue) : "");
            setEditing(true);
          }}
          className="flex items-center gap-1.5 font-mono text-sm font-medium hover:text-primary"
        >
          {formatUsd(currentValue)}
          <Pencil className="size-3 text-muted-foreground" />
        </button>
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
    <div className="flex flex-col gap-3 rounded-xl border border-dashed border-border p-3">
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
              <div>{c.text}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {formatTashkentDateTime(c.createdAt)} (Ташкент)
              </div>
            </div>
          ))}
          {(examRecord.paymentComments ?? []).length === 0 && (
            <p className="text-xs text-muted-foreground">Комментариев пока нет</p>
          )}
        </div>
        <div className="flex gap-2">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Например: оплатил наличными 50%..."
            className="min-h-16 text-sm"
          />
          <Button
            size="sm"
            className="self-end"
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
