"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, IdCard, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Student } from "@/lib/types";
import { fullName } from "@/lib/format";
import { useAppData } from "@/lib/data/store-context";
import { useTranslation } from "@/lib/i18n/context";

export function StudentSearch({
  onSelect,
}: {
  onSelect: (student: Student) => void;
}) {
  const { findStudentsByQuery, partners } = useAppData();
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  const results = query.trim() ? findStudentsByQuery(query).slice(0, 8) : [];

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("students.searchPlaceholder")}
          className="pl-9 pr-8"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {query.trim() && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-lg"
          >
            <motion.div layout className="flex flex-col divide-y divide-border">
              <AnimatePresence initial={false}>
                {results.map((s) => {
                  const partner = partners.find((p) => p.id === s.partnerId);
                  return (
                    <motion.button
                      key={s.id}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18 }}
                      onClick={() => {
                        onSelect(s);
                        setQuery("");
                      }}
                      className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm hover:bg-accent"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">{fullName(s)}</div>
                        <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <IdCard className="size-3" />
                            {s.passportNumber}
                          </span>
                          {s.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="size-3" />
                              {s.phone}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {partner?.code ?? "—"}
                      </span>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
              {results.length === 0 && (
                <div className="px-3.5 py-3 text-sm text-muted-foreground">
                  {t("common.notFound")}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
