"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Wallet, TrendingUp, Coins, Hourglass, Trash2, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { useAppData } from "@/lib/data/store-context";
import { AddDepositDialog } from "@/components/finance/add-deposit-dialog";
import { Button } from "@/components/ui/button";
import { formatUsd, formatTashkentDateTime, fullName } from "@/lib/format";
import type { FinanceTransaction } from "@/lib/types";
import { useTranslation } from "@/lib/i18n/context";

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className={`flex size-9 items-center justify-center rounded-xl ${accent}`}>
          <Icon className="size-4.5" strokeWidth={2.2} />
        </span>
      </div>
      <div className="mt-3 text-2xl font-bold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function DeleteTransactionButton({ transactionId }: { transactionId: string }) {
  const { deleteFinanceTransaction } = useAppData();
  const { t } = useTranslation();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(t("finance.deleteConfirm"))) return;
    setDeleting(true);
    try {
      await deleteFinanceTransaction(transactionId);
      toast.success(t("finance.deletedToast"));
    } catch {
      toast.error(t("finance.deleteFailedToast"));
      setDeleting(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-7 text-muted-foreground hover:text-destructive"
      onClick={handleDelete}
      disabled={deleting}
    >
      {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
    </Button>
  );
}

function PartnerRow({
  partnerId,
  name,
  code,
  deposits,
  deducted,
  transactions,
  students,
}: {
  partnerId: string;
  name: string;
  code: string;
  deposits: number;
  deducted: number;
  transactions: FinanceTransaction[];
  students: ReturnType<typeof useAppData>["students"];
}) {
  const { t, locale } = useTranslation();
  const [open, setOpen] = useState(false);
  const balance = deposits - deducted;

  return (
    <div className="rounded-xl border border-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          {open ? (
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          )}
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{name}</div>
            <div className="text-xs text-muted-foreground">{code}</div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-4 text-sm">
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground uppercase">{t("finance.statTotal")}</div>
            <div className="font-mono">{formatUsd(deposits)}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground uppercase">{t("finance.statProfit")}</div>
            <div className="font-mono">{formatUsd(deducted)}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground uppercase">{t("finance.statBalance")}</div>
            <div className={`font-mono font-semibold ${balance < 0 ? "text-destructive" : ""}`}>
              {formatUsd(balance)}
            </div>
          </div>
        </div>
      </button>

      {open && (
        <div className="flex flex-col gap-1.5 border-t border-border px-4 py-3">
          <div className="mb-1">
            <AddDepositDialog defaultPartnerId={partnerId} />
          </div>
          {transactions.length === 0 && (
            <p className="text-xs text-muted-foreground">{t("finance.noOperations")}</p>
          )}
          {transactions.map((t2) => {
            const student = students.find((s) => s.id === t2.studentId);
            const isDeposit = t2.kind === "deposit";
            const isPositive = t2.amountUsd >= 0;
            return (
              <div
                key={t2.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={isPositive ? "text-emerald-700" : "text-foreground"}>
                      {isPositive ? "+" : "−"}
                      {formatUsd(Math.abs(t2.amountUsd))}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {isDeposit ? (isPositive ? t("finance.deposited") : t("finance.withdrawn")) : t(`finance.kinds.${t2.kind}`)}
                    </span>
                    {student && (
                      <span className="truncate text-xs text-muted-foreground">· {fullName(student)}</span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {formatTashkentDateTime(t2.createdAt, locale)} ({t("common.tashkent")})
                    {t2.note ? ` · ${t2.note}` : ""}
                  </div>
                </div>
                {isDeposit && <DeleteTransactionButton transactionId={t2.id} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function FinancePage() {
  const { partners, students, financeTransactions } = useAppData();
  const { t } = useTranslation();

  const byPartner = useMemo(() => {
    const map = new Map<
      string,
      { deposits: number; registration: number; consultation: number; exam: number; transactions: FinanceTransaction[] }
    >();
    for (const t of financeTransactions) {
      const entry = map.get(t.partnerId) ?? {
        deposits: 0,
        registration: 0,
        consultation: 0,
        exam: 0,
        transactions: [],
      };
      if (t.kind === "deposit") entry.deposits += t.amountUsd;
      else entry[t.kind] += t.amountUsd;
      entry.transactions.push(t);
      map.set(t.partnerId, entry);
    }
    return map;
  }, [financeTransactions]);

  const totals = useMemo(() => {
    let deposits = 0;
    let deducted = 0;
    for (const entry of byPartner.values()) {
      deposits += entry.deposits;
      deducted += entry.registration + entry.consultation + entry.exam;
    }
    let pendingExamFees = 0;
    for (const s of students) {
      if (!s.partnerId) continue;
      for (const r of s.examRecords) {
        if (r.status === "scheduled" && r.examFeeUsd) pendingExamFees += r.examFeeUsd;
      }
    }
    return {
      deposits,
      deducted,
      balance: deposits - deducted,
      expected: deducted + pendingExamFees,
    };
  }, [byPartner, students]);

  const partnersWithActivity = partners
    .map((p) => ({ partner: p, entry: byPartner.get(p.id) }))
    .filter((x) => x.entry)
    .sort((a, b) => (b.entry?.deposits ?? 0) - (a.entry?.deposits ?? 0));

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("finance.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("finance.subtitle")}
          </p>
        </div>
        <AddDepositDialog />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Wallet}
          label={t("finance.statTotal")}
          value={formatUsd(totals.deposits)}
          sub={t("finance.statTotalSub")}
          accent="text-blue-600 bg-blue-50"
        />
        <StatCard
          icon={Coins}
          label={t("finance.statBalance")}
          value={formatUsd(totals.balance)}
          sub={t("finance.statBalanceSub")}
          accent="text-amber-600 bg-amber-50"
        />
        <StatCard
          icon={TrendingUp}
          label={t("finance.statProfit")}
          value={formatUsd(totals.deducted)}
          sub={t("finance.statProfitSub")}
          accent="text-emerald-600 bg-emerald-50"
        />
        <StatCard
          icon={Hourglass}
          label={t("finance.statExpected")}
          value={formatUsd(totals.expected)}
          sub={t("finance.statExpectedSub")}
          accent="text-violet-600 bg-violet-50"
        />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">{t("finance.byPartner")}</h3>
        {partnersWithActivity.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {t("finance.noDeposits")}
          </p>
        )}
        {partnersWithActivity.map(({ partner, entry }) => (
          <PartnerRow
            key={partner.id}
            partnerId={partner.id}
            name={partner.name}
            code={partner.code}
            deposits={entry!.deposits}
            deducted={entry!.registration + entry!.consultation + entry!.exam}
            transactions={entry!.transactions}
            students={students}
          />
        ))}
      </div>
    </div>
  );
}
