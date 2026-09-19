"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";

export function PinDialog({
  open,
  onOpenChange,
  onConfirm,
  error,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: (pin: string) => void;
  /** Set after a failed attempt to show an inline error message. */
  error?: string | null;
}) {
  const { t } = useTranslation();
  const [pin, setPin] = useState("");

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setPin("");
      }}
    >
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Lock className="size-4" />
            {t("pinDialog.title")}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="pin-input">{t("pinDialog.label")}</Label>
          <Input
            id="pin-input"
            type="password"
            inputMode="numeric"
            maxLength={8}
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && pin) onConfirm(pin);
            }}
            placeholder="••••"
            className="text-center font-mono text-lg tracking-[0.3em]"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button disabled={!pin} onClick={() => onConfirm(pin)}>
            {t("pinDialog.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
