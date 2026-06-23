-- Analytics: open/reply tracking on send_log, pending status for pre-send rows

alter table send_log
  add column if not exists opened_at timestamptz,
  add column if not exists replied_at timestamptz;

alter table send_log drop constraint if exists send_log_status_check;

alter table send_log
  add constraint send_log_status_check
  check (status in ('pending', 'sent', 'failed', 'bounced'));

create index if not exists idx_send_log_campaign_status
  on send_log (campaign_id, status);

create index if not exists idx_send_log_opened
  on send_log (opened_at)
  where opened_at is not null;

create index if not exists idx_send_log_replied
  on send_log (replied_at)
  where replied_at is not null;
