-- Align subscriptions with billing spec (enterprise, past_due, Paystack customer, monthly cap).

alter table subscriptions drop constraint if exists subscriptions_plan_check;
alter table subscriptions add constraint subscriptions_plan_check
  check (plan in ('trial', 'starter', 'growth', 'agency', 'enterprise'));

alter table subscriptions drop constraint if exists subscriptions_status_check;
alter table subscriptions add constraint subscriptions_status_check
  check (status in ('active', 'cancelled', 'expired', 'past_due'));

alter table subscriptions
  add column if not exists paystack_customer_code text,
  add column if not exists max_emails_per_month integer;

alter table subscriptions
  alter column trial_expires_at set default (now() + interval '3 days');

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

create or replace function increment_trial_emails_sent(p_user_email text)
returns setof subscriptions
language plpgsql
as $$
begin
  return query
  update subscriptions
  set trial_emails_sent = trial_emails_sent + 1
  where user_email = p_user_email
    and plan = 'trial'
  returning *;
end;
$$;
