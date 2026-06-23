-- Align trial defaults with product spec: 3-day trial window
alter table subscriptions
  alter column trial_expires_at set default (now() + interval '3 days');
