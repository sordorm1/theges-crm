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

export function AddDepositDialog({ defaultPartnerId }: { defaultPartnerId?: string }) {
  const { partners, addDeposit } = useAppData();
  const [open, setOpen] = useState(false);
  const [partnerId, setPartnerId] = useState(defaultPartnerId ?? "");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  function reset() {
    setPartnerId(defaultPartnerId ?? "");
    setAmount("");
    setNote("");
  }

  async function handleSave() {
    const value = Number(amount.replace(",", "."));
    if (!partnerId) {
      toast.error("Выберите партнёра");
      return;
    }
    if (!amount || Number.isNaN(value) || value <= 0) {
      toast.error("Введите сумму больше нуля");
      return;
    }
    setSaving(true);
    try {
      await addDeposit(partnerId, value, note.trim() || undefined);
      const partner = partners.find((p) => p.id === partnerId);
      toast.success(`Депозит $${value} от «${partner?.name}» добавлен`);
      reset();
      setOpen(false);
    } catch {
      toast.error("Не удалось добавить депозит");
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
        Добавить депозит
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Новый депозит</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Партнёр</Label>
            <Select
              value={partnerId}
              onValueChange={(v) => setPartnerId(v ?? "")}
              items={Object.fromEntries(partners.map((p) => [p.id, `${p.name} (${p.code})`]))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Выберите партнёра" />
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
            <Label>Сумма, $</Label>
            <Input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="10000"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Комментарий (необязательно)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Например: наличными, за сентябрь"
              className="min-h-16 text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
