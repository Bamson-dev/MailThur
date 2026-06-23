create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_email text not null unique,
  plan text not null default 'trial' check (plan in ('trial', 'starter', 'growth', 'agency', 'enterprise')),
  status text not null default 'active' check (status in ('active', 'cancelled', 'expired', 'past_due')),
  trial_emails_sent integer not null default 0,
  trial_started_at timestamptz not null default now(),
  trial_expires_at timestamptz not null default (now() + interval '3 days'),
  current_period_start timestamptz,
  current_period_end timestamptz,
  paystack_subscription_code text,
  paystack_customer_code text,
  flutterwave_subscription_id text,
  max_inboxes integer not null default 1,
  max_emails_per_month integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_subscriptions_user on subscriptions (user_email);

create or replace function update_subscription_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists subscriptions_updated_at on subscriptions;
create trigger subscriptions_updated_at
before update on subscriptions
for each row execute function update_subscription_timestamp();
