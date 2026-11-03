-- ConnectAssist v2 migration (BEO update).
-- Paste the whole file into Supabase -> SQL Editor and click Run. Safe to run more than once.
-- Run this BEFORE (or right after) you deploy the new code, otherwise saving an event shows "Not saved".

-- 1. New columns: end date/time, "Event Food, Beverage & Extras", and who booked the event
alter table events add column if not exists end_date date;
alter table events add column if not exists end_time text;
alter table events add column if not exists food_beverage text not null default '';
alter table events add column if not exists booked_by text not null default '';
update events set booked_by = 'Pawl Berger' where booked_by = '';

-- 2. New event types: NextGen, JIM, Rituals, Events, Other. Old types become 'Events' (re-tag them in the app if you like).
update events set type = 'Events' where type not in ('NextGen', 'JIM', 'Rituals', 'Events', 'Other');

-- 3. "Floor plan" is no longer a to-do item (the home page now shows an "Add floor plan" button instead)
update events set todos = coalesce((select jsonb_agg(t) from jsonb_array_elements(todos) t where t->>'text' <> 'Floor plan'), '[]'::jsonb);

-- 4. The public share function now returns the new fields too (old links keep working)
create or replace function get_shared_event(p_token text) returns jsonb
language sql security definer set search_path = public as $$
  select jsonb_build_object(
    'name', e.name, 'date', e.date, 'time', e.time, 'endDate', e.end_date, 'endTime', e.end_time,
    'bookedBy', e.booked_by, 'foodBeverage', e.food_beverage,
    'room', e.room, 'type', e.type,
    'expectedGuests', e.expected_guests, 'notes', e.notes, 'needsFloorPlan', e.needs_floor_plan,
    'schedule', e.schedule, 'floorPlan', case when e.needs_floor_plan then e.floor_plan else null end,
    'contacts', coalesce((select jsonb_agg(jsonb_build_object('name', c.name, 'category', c.category))
                          from contacts c where c.id = any(e.contact_ids)), '[]'::jsonb)
  ) from events e where e.share_token = p_token and p_token is not null and length(p_token) >= 12;
$$;
revoke all on function get_shared_event(text) from public;
grant execute on function get_shared_event(text) to anon, authenticated;

-- OPTIONAL: the Share link button is gone from the app. To also switch off every link that was already handed out, uncomment:
-- update events set share_token = null;
