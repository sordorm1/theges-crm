"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Phone, Users, Trash2, Loader2 } from "lucide-react";
import type { Partner } from "@/lib/types";
import { useAppData } from "@/lib/data/store-context";

export function PartnerCard({
  partner,
  studentCount,
  index,
}: {
  partner: Partner;
  studentCount: number;
  index: number;
}) {
  const { deletePartner } = useAppData();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Удалить партнёра «${partner.name}»? Ученики останутся, но без партнёра.`)) return;
    setDeleting(true);
    try {
      await deletePartner(partner.id);
      toast.success("Партнёр удалён");
    } catch {
      toast.error("Не удалось удалить партнёра");
      setDeleting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.3 }}
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/students?partner=${partner.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter") router.push(`/students?partner=${partner.id}`);
      }}
      className="group flex cursor-pointer flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex size-12 items-center justify-center overflow-hidden rounded-xl bg-muted">
          {partner.logoDataUrl ? (
            <Image
              src={partner.logoDataUrl}
              alt={partner.name}
              width={48}
              height={48}
              className="size-full object-cover"
            />
          ) : (
            <span className="text-sm font-bold text-muted-foreground">
              {partner.code.slice(0, 3)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold tracking-wide text-secondary-foreground">
            {partner.code}
          </span>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            aria-label="Удалить партнёра"
            className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
          </button>
        </div>
      </div>

      <div>
        <h3 className="line-clamp-1 text-sm font-semibold group-hover:text-primary">
          {partner.name}
        </h3>
        {partner.phone && (
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Phone className="size-3.5" />
            {partner.phone}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
        <Users className="size-3.5" />
        <span className="font-medium text-foreground">{studentCount}</span>
        учеников
      </div>
    </motion.div>
  );
}
