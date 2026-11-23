-- ConnectAssist v3 migration (recurring events).
-- Paste into Supabase -> SQL Editor and click Run. Safe to run more than once.
-- Run it BEFORE using the new version, otherwise saving an event shows "Not saved".

-- Events created together as one recurring series share a series_id and a repeat rule.
alter table events add column if not exists series_id uuid;
alter table events add column if not exists repeat_rule text;
create index if not exists events_series_idx on events (series_id);
