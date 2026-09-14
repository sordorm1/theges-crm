"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppData } from "@/lib/data/store-context";
import { compressImage } from "@/lib/image/compress";
import Image from "next/image";

export function AddPartnerDialog() {
  const { addPartner, nextPartnerCode } = useAppData();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [logo, setLogo] = useState<string | undefined>();
  const [compressing, setCompressing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);

  function reset() {
    setName("");
    setPhone("");
    setCode("");
    setLogo(undefined);
    setOriginalSize(null);
    setCompressedSize(null);
  }

  async function handleFile(file: File) {
    setCompressing(true);
    setOriginalSize(file.size);
    try {
      const compressed = await compressImage(file);
      setLogo(compressed);
      setCompressedSize(Math.round((compressed.length * 3) / 4));
    } catch {
      toast.error("Не удалось обработать изображение");
    } finally {
      setCompressing(false);
    }
  }

  async function handleSubmit() {
    if (!name.trim()) {
      toast.error("Укажите название компании");
      return;
    }
    const finalCode = code.trim() || nextPartnerCode(name);
    setSaving(true);
    try {
      await addPartner({
        name: name.trim(),
        phone: phone.trim(),
        code: finalCode.toUpperCase(),
        logoDataUrl: logo,
      });
      toast.success(`Партнёр «${name.trim()}» добавлен`);
      reset();
      setOpen(false);
    } catch {
      toast.error("Не удалось сохранить партнёра");
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
        Добавить партнёра
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Новый партнёр</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted">
              {compressing ? (
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              ) : logo ? (
                <Image src={logo} alt="Logo" width={64} height={64} className="size-full object-cover" />
              ) : (
                <Upload className="size-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="logo-upload" className="w-fit cursor-pointer text-xs font-medium text-primary hover:underline">
                Загрузить лого
              </Label>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
              {originalSize && compressedSize && (
                <span className="text-[11px] text-muted-foreground">
                  {Math.round(originalSize / 1024)} КБ → {Math.round(compressedSize / 1024)} КБ
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="partner-name">Название компании</Label>
            <Input
              id="partner-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Global Study Center"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="partner-phone">Телефон</Label>
              <Input
                id="partner-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+998 90 123 45 67"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="partner-code">Код партнёра</Label>
              <Input
                id="partner-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder={name ? nextPartnerCode(name) : "AUTO"}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
