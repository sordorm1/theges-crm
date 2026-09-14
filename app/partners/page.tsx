"use client";

import { useMemo } from "react";
import { useAppData } from "@/lib/data/store-context";
import { PartnerCard } from "@/components/partners/partner-card";
import { AddPartnerDialog } from "@/components/partners/add-partner-dialog";

export default function PartnersPage() {
  const { partners, students } = useAppData();

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of students) {
      if (!s.partnerId) continue;
      map.set(s.partnerId, (map.get(s.partnerId) ?? 0) + 1);
    }
    return map;
  }, [students]);

  const sorted = useMemo(
    () =>
      [...partners].sort(
        (a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0),
      ),
    [partners, counts],
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Партнёры</h1>
          <p className="text-sm text-muted-foreground">
            Консалтинговые фирмы, которые приводят учеников · {partners.length} всего
          </p>
        </div>
        <AddPartnerDialog />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sorted.map((p, i) => (
          <PartnerCard
            key={p.id}
            partner={p}
            studentCount={counts.get(p.id) ?? 0}
            index={i}
          />
        ))}
      </div>

      {sorted.length === 0 && (
        <p className="text-sm text-muted-foreground">Пока нет партнёров</p>
      )}
    </div>
  );
}
