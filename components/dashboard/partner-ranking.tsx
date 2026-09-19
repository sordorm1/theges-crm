"use client";

import Image from "next/image";
import type { Partner } from "@/lib/types";
import { useTranslation } from "@/lib/i18n/context";

export function PartnerRanking({
  ranking,
}: {
  ranking: { partner: Partner; count: number }[];
}) {
  const { t } = useTranslation();
  const max = Math.max(1, ...ranking.map((r) => r.count));
  const top = ranking.slice(0, 6);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">{t("dashboard.partnerRanking.title")}</h3>
        <p className="text-xs text-muted-foreground">{t("dashboard.partnerRanking.subtitle")}</p>
      </div>
      <div className="flex flex-col gap-3">
        {top.map(({ partner, count }, i) => (
          <div key={partner.id} className="flex items-center gap-3">
            <span className="w-5 text-xs font-semibold text-muted-foreground">
              {i + 1}
            </span>
            <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
              {partner.logoDataUrl ? (
                <Image
                  src={partner.logoDataUrl}
                  alt={partner.name}
                  width={32}
                  height={32}
                  className="size-full object-cover"
                />
              ) : (
                <span className="text-[10px] font-bold text-muted-foreground">
                  {partner.code.slice(0, 3)}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate font-medium">{partner.name}</span>
                <span className="shrink-0 font-semibold text-foreground">{count}</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
        {top.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("dashboard.partnerRanking.noData")}</p>
        )}
      </div>
    </div>
  );
}
