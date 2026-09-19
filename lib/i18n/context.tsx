"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import ru from "@/lib/i18n/dictionaries/ru";
import uz from "@/lib/i18n/dictionaries/uz";

export type Locale = "uz" | "ru";

const DICTIONARIES: Record<Locale, typeof ru> = { ru, uz };
const STORAGE_KEY = "theges.locale";

type LeafValue = string | ((...args: never[]) => string);

function resolvePath(path: string, locale: Locale): LeafValue | undefined {
  const parts = path.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let node: any = DICTIONARIES[locale];
  for (const part of parts) {
    if (node == null) return undefined;
    node = node[part];
  }
  return node;
}

interface TranslateFn {
  (path: string): string;
  (path: string, ...args: unknown[]): string;
}

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslateFn;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("uz");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync of persisted locale on mount
      if (stored === "uz" || stored === "ru") setLocaleState(stored);
    } catch {
      // localStorage unavailable — keep default
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback<TranslateFn>(
    (path: string, ...args: unknown[]) => {
      const value = resolvePath(path, locale) ?? resolvePath(path, "ru");
      if (typeof value === "function") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (value as any)(...args);
      }
      if (typeof value === "string") return value;
      return path;
    },
    [locale],
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useTranslation must be used within LocaleProvider");
  return ctx;
}
