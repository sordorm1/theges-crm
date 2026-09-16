-- Finance ledger: partner deposits (money in) and deductions
-- (registration/consultation/exam fees, money "spent" against that deposit
-- as students are processed). One row per (exam_record_id, kind) for
-- registration/consultation/exam so re-saving a fee just updates the
-- existing entry instead of duplicating it; deposits have no exam_record_id
-- and can repeat freely.
create table if not exists finance_transactions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references partners(id) on delete cascade,
  student_id uuid references students(id) on delete set null,
  exam_record_id uuid references exam_records(id) on delete cascade,
  kind text not null check (kind in ('deposit', 'registration', 'consultation', 'exam')),
  amount_usd numeric(10, 2) not null,
  note text,
  created_at timestamptz not null default now()
);

create unique index if not exists finance_tx_exam_kind_uidx
  on finance_transactions (exam_record_id, kind)
  where exam_record_id is not null;

create index if not exists finance_tx_partner_idx on finance_transactions (partner_id);
create index if not exists finance_tx_student_idx on finance_transactions (student_id);

alter table finance_transactions enable row level security;
create policy "anon can read finance_transactions" on finance_transactions for select using (true);
