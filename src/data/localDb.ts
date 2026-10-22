import type { Contact, EventRec, SharedEvent } from '../types'
import type { Db } from './db'

const KEY = 'connectassist.v1'
interface Blob { events: EventRec[]; contacts: Contact[] }
const read = (): Blob => {
  try { return JSON.parse(localStorage.getItem(KEY) || '') as Blob } catch { return { events: [], contacts: [] } }
}
const write = (b: Blob) => localStorage.setItem(KEY, JSON.stringify(b))
const upsert = <T extends { id: string }>(list: T[], item: T) => {
  const i = list.findIndex((x) => x.id === item.id)
  return i >= 0 ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item]
}

/** Demo mode: everything stays in this browser. Used when no Supabase keys are configured. */
export const localDb: Db = {
  mode: 'local',
  async loadAll() { return read() },
  async saveEvent(e) { const b = read(); write({ ...b, events: upsert(b.events, e) }) },
  async deleteEvent(id) { const b = read(); write({ ...b, events: b.events.filter((e) => e.id !== id) }) },
  async saveContact(c) { const b = read(); write({ ...b, contacts: upsert(b.contacts, c) }) },
  async deleteContact(id) {
    const b = read()
    write({
      contacts: b.contacts.filter((c) => c.id !== id),
      events: b.events.map((e) => ({ ...e, contactIds: e.contactIds.filter((x) => x !== id) })),
    })
  },
  async getShared(token): Promise<SharedEvent | null> {
    const b = read()
    const e = b.events.find((x) => x.shareToken && x.shareToken === token)
    if (!e) return null
    return {
      name: e.name, date: e.date, time: e.time, room: e.room, type: e.type,
      expectedGuests: e.expectedGuests, notes: e.notes, needsFloorPlan: e.needsFloorPlan, schedule: e.schedule,
      contacts: b.contacts.filter((c) => e.contactIds.includes(c.id)).map((c) => ({ name: c.name, category: c.category })),
    }
  },
  async insertMany(events, contacts) { const b = read(); write({ events: [...b.events, ...events], contacts: [...b.contacts, ...contacts] }) },
  async deleteSample() {
    const b = read()
    const gone = new Set(b.contacts.filter((c) => c.isSample).map((c) => c.id))
    write({
      contacts: b.contacts.filter((c) => !c.isSample),
      events: b.events.filter((e) => !e.isSample).map((e) => ({ ...e, contactIds: e.contactIds.filter((x) => !gone.has(x)) })),
    })
  },
}
