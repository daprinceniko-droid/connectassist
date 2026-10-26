-- ConnectAssist schema. Safe to re-run: paste the whole file into Supabase → SQL Editor and click Run.
create extension if not exists pgcrypto;

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  speciality text not null default '',
  email text not null default '',
  phone text not null default '',
  notes text not null default '',
  is_sample boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date not null,
  time text not null default '18:00',
  room text not null default '',
  type text not null,
  expected_guests int,
  actual_guests int,
  rating text,
  reflection text not null default '',
  notes text not null default '',
  cover_url text,
  needs_floor_plan boolean not null default true,
  floor_plan jsonb,
  staff_count int,
  schedule jsonb not null default '[]',
  todos jsonb not null default '[]',
  contact_ids uuid[] not null default '{}',
  share_token text unique,
  is_sample boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists events_date_idx on events (date desc);

create table if not exists floor_plan_presets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  room text not null,
  items jsonb not null default '[]',
  created_at timestamptz not null default now()
);

-- Only the two signed-in users (Pawl + the Connector Intern) can touch data.
alter table contacts enable row level security;
alter table events enable row level security;
alter table floor_plan_presets enable row level security;
drop policy if exists "team full access" on contacts;
drop policy if exists "team full access" on events;
drop policy if exists "team full access" on floor_plan_presets;
create policy "team full access" on contacts for all to authenticated using (true) with check (true);
create policy "team full access" on events for all to authenticated using (true) with check (true);
create policy "team full access" on floor_plan_presets for all to authenticated using (true) with check (true);

-- GDPR: deleting a contact also removes it from every event that referenced it.
create or replace function scrub_deleted_contact() returns trigger language plpgsql as $$
begin
  update events set contact_ids = array_remove(contact_ids, old.id) where old.id = any(contact_ids);
  return old;
end $$;
drop trigger if exists contact_deleted on contacts;
create trigger contact_deleted before delete on contacts for each row execute function scrub_deleted_contact();

-- Public, read-only share link: anyone with the secret token sees ONE rundown.
-- Contact names + categories only (no emails/phones), no reflection/rating.
create or replace function get_shared_event(p_token text) returns jsonb
language sql security definer set search_path = public as $$
  select jsonb_build_object(
    'name', e.name, 'date', e.date, 'time', e.time, 'room', e.room, 'type', e.type,
    'expectedGuests', e.expected_guests, 'notes', e.notes, 'needsFloorPlan', e.needs_floor_plan,
    'schedule', e.schedule, 'floorPlan', case when e.needs_floor_plan then e.floor_plan else null end,
    'contacts', coalesce((select jsonb_agg(jsonb_build_object('name', c.name, 'category', c.category))
                          from contacts c where c.id = any(e.contact_ids)), '[]'::jsonb)
  ) from events e where e.share_token = p_token and p_token is not null and length(p_token) >= 12;
$$;
revoke all on function get_shared_event(text) from public;
grant execute on function get_shared_event(text) to anon, authenticated;
