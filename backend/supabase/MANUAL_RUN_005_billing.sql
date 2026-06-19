-- Run manually on staging Supabase if migration 005_billing not yet applied.

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_email text not null unique,
  plan text not null default 'trial' check (plan in ('trial', 'starter', 'growth', 'agency')),
  status text not null default 'active' check (status in ('active', 'cancelled', 'expired')),
  trial_emails_sent integer not null default 0,
  trial_started_at timestamptz not null default now(),
  trial_expires_at timestamptz not null default (now() + interval '7 days'),
  current_period_start timestamptz,
  current_period_end timestamptz,
  paystack_subscription_code text,
  flutterwave_subscription_id text,
  max_inboxes integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_subscriptions_user on subscriptions (user_email);
