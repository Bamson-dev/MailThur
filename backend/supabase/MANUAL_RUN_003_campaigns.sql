-- MANUAL STEP REQUIRED: Run this SQL in the MailThur staging Supabase SQL Editor
-- if migration 003_campaigns has not been applied automatically.
-- File source: backend/supabase/migrations/003_campaigns.sql

create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists campaign_steps (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  step_order integer not null,
  subject text not null,
  body text not null,
  delay_days integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists campaign_contacts (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  email text not null,
  first_name text,
  business_name text,
  city text,
  custom_fields jsonb default '{}',
  current_step integer not null default 0,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'bounced', 'unsubscribed', 'replied')),
  next_send_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists send_log (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  contact_id uuid not null references campaign_contacts(id) on delete cascade,
  inbox_id uuid not null references connected_inboxes(id),
  step_order integer not null,
  status text not null check (status in ('sent', 'failed', 'bounced')),
  error_message text,
  sent_at timestamptz not null default now()
);

create index if not exists idx_campaigns_user on campaigns (user_email);
create index if not exists idx_campaign_steps_campaign on campaign_steps (campaign_id, step_order);
create index if not exists idx_campaign_contacts_campaign on campaign_contacts (campaign_id);
create index if not exists idx_campaign_contacts_next_send on campaign_contacts (next_send_at) where status in ('pending', 'in_progress');
create index if not exists idx_send_log_inbox on send_log (inbox_id, sent_at);

alter table connected_inboxes alter column daily_send_cap set default 20;
