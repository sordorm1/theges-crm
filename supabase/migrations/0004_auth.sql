-- Login/password accounts for the CRM itself (not Supabase Auth: that needs
-- an e-mail and a 6+ character password). Roles: 'admin' (the director,
-- sees everything and manages users) and 'staff' (sees only the sections
-- listed in `permissions`). Only Edge Functions (service_role) ever touch
-- these tables; no anon policies are created on purpose, so password hashes
-- are unreachable from the browser.
create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  login text not null unique check (login ~ '^[a-z0-9._-]{3,20}$'),
  display_name text not null default '',
  password_hash text not null,
  password_salt text not null,
  role text not null default 'staff' check (role in ('admin', 'staff')),
  permissions text[] not null default '{}',
  is_active boolean not null default true,
  failed_attempts int not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

create table if not exists app_sessions (
  token_hash text primary key,
  user_id uuid not null references app_users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists app_sessions_user_idx on app_sessions (user_id);

alter table app_users enable row level security;
alter table app_sessions enable row level security;
