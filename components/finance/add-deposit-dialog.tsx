"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppData } from "@/lib/data/store-context";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export function AddDepositDialog({ defaultPartnerId }: { defaultPartnerId?: string }) {
  const { partners, addDeposit } = useAppData();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [partnerId, setPartnerId] = useState(defaultPartnerId ?? "");
  const [direction, setDirection] = useState<"in" | "out">("in");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  function reset() {
    setPartnerId(defaultPartnerId ?? "");
    setDirection("in");
    setAmount("");
    setNote("");
  }

  async function handleSave() {
    const value = Number(amount.replace(",", "."));
    if (!partnerId) {
      toast.error(t("finance.selectPartnerToast"));
      return;
    }
    if (!amount || Number.isNaN(value) || value <= 0) {
      toast.error(t("finance.amountToast"));
      return;
    }
    setSaving(true);
    try {
      await addDeposit(partnerId, value, direction, note.trim() || undefined);
      const partner = partners.find((p) => p.id === partnerId);
      toast.success(
        direction === "in"
          ? t("finance.addedToast", value, partner?.name)
          : t("finance.withdrawnToast", value, partner?.name),
      );
      reset();
      setOpen(false);
    } catch {
      toast.error(t("finance.saveFailedToast"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger render={<Button className="gap-2" />}>
        <Plus className="size-4" />
        {t("finance.addDeposit")}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("finance.newDeposit")}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-0.5 rounded-full bg-muted p-0.5 self-start">
            {(["in", "out"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDirection(d)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  direction === d
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {d === "in" ? t("finance.directionIn") : t("finance.directionOut")}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("finance.partner")}</Label>
            <Select
              value={partnerId}
              onValueChange={(v) => setPartnerId(v ?? "")}
              items={Object.fromEntries(partners.map((p) => [p.id, `${p.name} (${p.code})`]))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("finance.selectPartner")} />
              </SelectTrigger>
              <SelectContent>
                {partners.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("finance.amount")}</Label>
            <Input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="10000"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("finance.comment")}</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("finance.commentPlaceholder")}
              className="min-h-16 text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
