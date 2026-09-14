-- the GES CRM v2 schema
create extension if not exists pgcrypto;

create table if not exists partners (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  phone text not null default '',
  logo_url text,
  created_at timestamptz not null default now()
);

create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  key text not null unique, -- stable slug, e.g. 'english'
  label text not null,
  sort_order int not null default 0
);

create table if not exists subject_levels (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects(id) on delete cascade,
  label text not null,
  sort_order int not null default 0,
  unique (subject_id, label)
);

create table if not exists exam_programs (
  id uuid primary key default gen_random_uuid(),
  key text not null unique, -- stable slug, e.g. 'ielts'
  subject_id uuid not null references subjects(id) on delete restrict,
  name text not null,
  short_name text not null,
  color text not null default '#1e5fbf'
);

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  middle_name text,
  last_name text not null,
  passport_number text not null,
  phone text not null default '',
  email text,
  partner_id uuid references partners(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists students_passport_idx on students (passport_number);
create index if not exists students_phone_idx on students (phone);

create table if not exists exam_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  exam_program_id uuid not null references exam_programs(id) on delete restrict,
  date timestamptz not null default now(),
  status text not null default 'scheduled' check (status in ('scheduled','passed','failed')),
  score text,
  level_label text,
  login text not null default '',
  password text not null default '',
  exam_key text not null default '',
  registration_fee_usd numeric(10,2),
  exam_fee_usd numeric(10,2),
  consultation_fee_usd numeric(10,2),
  created_at timestamptz not null default now()
);
create index if not exists exam_records_student_idx on exam_records (student_id);
create index if not exists exam_records_program_idx on exam_records (exam_program_id);

create table if not exists payment_comments (
  id uuid primary key default gen_random_uuid(),
  exam_record_id uuid not null references exam_records(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);
create index if not exists payment_comments_exam_record_idx on payment_comments (exam_record_id);

-- Row Level Security: locked down by default. All access goes through
-- Next.js Server Actions using the service_role key (bypasses RLS),
-- never through the anon key from the browser.
alter table partners enable row level security;
alter table subjects enable row level security;
alter table subject_levels enable row level security;
alter table exam_programs enable row level security;
alter table students enable row level security;
alter table exam_records enable row level security;
alter table payment_comments enable row level security;

-- Seed subjects (matches lib/data/programs.ts SUBJECT_LABELS)
insert into subjects (key, label, sort_order) values
  ('english', 'Английский', 1),
  ('spanish', 'Испанский', 2),
  ('arabic', 'Арабский', 3),
  ('math', 'Математика', 4)
on conflict (key) do nothing;

-- Seed exam programs (matches lib/data/programs.ts EXAM_PROGRAMS)
insert into exam_programs (key, subject_id, name, short_name, color)
select 'ielts', id, 'IELTS', 'IELTS', '#1e5fbf' from subjects where key = 'english'
on conflict (key) do nothing;
insert into exam_programs (key, subject_id, name, short_name, color)
select 'intensive-online', id, 'Intensive Online (2 месяца)', 'Intensive', '#2f8fd6' from subjects where key = 'english'
on conflict (key) do nothing;
insert into exam_programs (key, subject_id, name, short_name, color)
select 'sat', id, 'SAT', 'SAT', '#0f9d58' from subjects where key = 'math'
on conflict (key) do nothing;
insert into exam_programs (key, subject_id, name, short_name, color)
select 'gre', id, 'GRE', 'GRE', '#16b3a3' from subjects where key = 'math'
on conflict (key) do nothing;
insert into exam_programs (key, subject_id, name, short_name, color)
select 'spanish-dele', id, 'Испанский (DELE)', 'Испанский', '#e07b1f' from subjects where key = 'spanish'
on conflict (key) do nothing;
insert into exam_programs (key, subject_id, name, short_name, color)
select 'arabic', id, 'Арабский', 'Арабский', '#8b5cf6' from subjects where key = 'arabic'
on conflict (key) do nothing;

-- Seed English CEFR levels as a sensible default (editable later in Settings)
insert into subject_levels (subject_id, label, sort_order)
select id, lvl, ord from subjects, (values ('A1',1),('A2',2),('B1',3),('B2',4),('C1',5),('C2',6)) as t(lvl, ord)
where subjects.key = 'english'
on conflict (subject_id, label) do nothing;
