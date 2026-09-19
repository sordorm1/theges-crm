"use client";

import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export function LanguageSwitch() {
  const { locale, setLocale } = useTranslation();

  return (
    <div className="flex items-center gap-0.5 rounded-full bg-sidebar-accent/40 p-0.5">
      {(["uz", "ru"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase transition-colors",
            locale === l
              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
              : "text-sidebar-foreground/60 hover:text-sidebar-foreground",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
