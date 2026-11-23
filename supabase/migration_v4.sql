-- ConnectAssist v4 migration (floor plans for multiple rooms).
-- Paste into Supabase -> SQL Editor and click Run. Safe to run more than once.

alter table events add column if not exists floor_plans jsonb not null default '[]';

create or replace function get_shared_event(p_token text) returns jsonb
language sql security definer set search_path = public as $$
  select jsonb_build_object(
    'name', e.name, 'date', e.date, 'time', e.time, 'endDate', e.end_date, 'endTime', e.end_time, 'bookedBy', e.booked_by, 'foodBeverage', e.food_beverage,
    'room', e.room, 'type', e.type,
    'expectedGuests', e.expected_guests, 'notes', e.notes, 'needsFloorPlan', e.needs_floor_plan,
    'schedule', e.schedule,
    'floorPlan', case when e.needs_floor_plan then coalesce(e.floor_plans->0, e.floor_plan) else null end,
    'floorPlans', case when e.needs_floor_plan then coalesce(nullif(e.floor_plans, '[]'::jsonb), case when e.floor_plan is null then '[]'::jsonb else jsonb_build_array(e.floor_plan) end) else '[]'::jsonb end,
    'contacts', coalesce((select jsonb_agg(jsonb_build_object('name', c.name, 'category', c.category))
                          from contacts c where c.id = any(e.contact_ids)), '[]'::jsonb)
  ) from events e where e.share_token = p_token and p_token is not null and length(p_token) >= 12;
$$;
revoke all on function get_shared_event(text) from public;
grant execute on function get_shared_event(text) to anon, authenticated;
