import type { Contact, ContactCategory, EventRec, EventType, Preset, Rating, SharedEvent } from '../types'
import type { Db } from './db'
import { supabase, supabaseConfigured } from './supabaseClient'
export { supabaseConfigured }

/* eslint-disable @typescript-eslint/no-explicit-any */
const eventFromRow = (r: any): EventRec => ({
  id: r.id, name: r.name, date: r.date, time: r.time, room: r.room, type: r.type as EventType,
  expectedGuests: r.expected_guests, actualGuests: r.actual_guests, rating: r.rating as Rating | null,
  reflection: r.reflection ?? '', notes: r.notes ?? '', coverUrl: r.cover_url, needsFloorPlan: r.needs_floor_plan,
  floorPlan: r.floor_plan, staffCount: r.staff_count, schedule: r.schedule ?? [], todos: r.todos ?? [],
  contactIds: r.contact_ids ?? [], shareToken: r.share_token, isSample: r.is_sample, createdAt: r.created_at,
})
const eventToRow = (e: EventRec) => ({
  id: e.id, name: e.name, date: e.date, time: e.time, room: e.room, type: e.type,
  expected_guests: e.expectedGuests, actual_guests: e.actualGuests, rating: e.rating,
  reflection: e.reflection, notes: e.notes, cover_url: e.coverUrl, needs_floor_plan: e.needsFloorPlan,
  floor_plan: e.floorPlan, staff_count: e.staffCount, schedule: e.schedule, todos: e.todos,
  contact_ids: e.contactIds, share_token: e.shareToken, is_sample: e.isSample,
})
const contactFromRow = (r: any): Contact => ({
  id: r.id, name: r.name, category: r.category as ContactCategory, speciality: r.speciality ?? '',
  email: r.email ?? '', phone: r.phone ?? '', notes: r.notes ?? '', isSample: r.is_sample, createdAt: r.created_at,
})
const contactToRow = (c: Contact) => ({
  id: c.id, name: c.name, category: c.category, speciality: c.speciality, email: c.email,
  phone: c.phone, notes: c.notes, is_sample: c.isSample,
})
const presetFromRow = (r: any): Preset => ({ id: r.id, name: r.name, room: r.room, items: r.items ?? [], createdAt: r.created_at })
const check = ({ error }: { error: { message: string } | null }) => { if (error) throw new Error(error.message) }

export const supabaseDb: Db = {
  mode: 'supabase',
  async loadAll() {
    const [ev, co, pr] = await Promise.all([
      supabase.from('events').select('*').order('date', { ascending: false }),
      supabase.from('contacts').select('*').order('name'),
      supabase.from('floor_plan_presets').select('*').order('name'),
    ])
    check(ev); check(co)
    // presets table is new: if it hasn't been created yet, keep the rest of the app working
    return { events: (ev.data ?? []).map(eventFromRow), contacts: (co.data ?? []).map(contactFromRow), presets: pr.error ? [] : (pr.data ?? []).map(presetFromRow) }
  },
  async saveEvent(e) { check(await supabase.from('events').upsert(eventToRow(e))) },
  async deleteEvent(id) { check(await supabase.from('events').delete().eq('id', id)) },
  async saveContact(c) { check(await supabase.from('contacts').upsert(contactToRow(c))) },
  async deleteContact(id) { check(await supabase.from('contacts').delete().eq('id', id)) },
  async savePreset(p) { check(await supabase.from('floor_plan_presets').upsert({ id: p.id, name: p.name, room: p.room, items: p.items })) },
  async deletePreset(id) { check(await supabase.from('floor_plan_presets').delete().eq('id', id)) },
  async getShared(token) {
    const { data, error } = await supabase.rpc('get_shared_event', { p_token: token })
    if (error) throw new Error(error.message)
    return (data as SharedEvent | null) ?? null
  },
  async insertMany(events, contacts) {
    check(await supabase.from('contacts').insert(contacts.map(contactToRow)))
    check(await supabase.from('events').insert(events.map(eventToRow)))
  },
  async deleteSample() {
    check(await supabase.from('events').delete().eq('is_sample', true))
    check(await supabase.from('contacts').delete().eq('is_sample', true))
  },
}
