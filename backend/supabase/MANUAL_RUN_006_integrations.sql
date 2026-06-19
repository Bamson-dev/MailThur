-- MANUAL STEP: Run on staging Supabase if migration 006_integrations has not been applied.

alter table send_log
  add column if not exists gmail_thread_id text,
  add column if not exists gmail_message_id text;

create index if not exists idx_send_log_gmail_thread
  on send_log (gmail_thread_id)
  where gmail_thread_id is not null;

create index if not exists idx_send_log_inbox_sent
  on send_log (inbox_id, sent_at desc);
