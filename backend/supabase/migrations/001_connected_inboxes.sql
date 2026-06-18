create table if not exists connected_inboxes (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  provider text not null check (provider in ('google', 'microsoft')),
  inbox_email text not null,
  access_token text not null,
  refresh_token text not null,
  token_expires_at timestamptz not null,
  daily_send_cap integer not null default 30,
  status text not null default 'active' check (status in ('active', 'paused', 'disconnected', 'error')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_connected_inboxes_unique
  on connected_inboxes (user_email, inbox_email);

create index if not exists idx_connected_inboxes_user
  on connected_inboxes (user_email);
