import type { Contact, EventRec } from '../types'
import { todayISO } from './dates'

export const isUpcoming = (e: EventRec) => e.date >= todayISO()
export const needsUpdate = (e: EventRec) => e.date < todayISO() && e.actualGuests == null
export const byDateDesc = (a: EventRec, b: EventRec) => (a.date === b.date ? b.time.localeCompare(a.time) : b.date.localeCompare(a.date))
export const byDateAsc = (a: EventRec, b: EventRec) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date))
export const nextUp = (events: EventRec[]) => events.filter(isUpcoming).sort(byDateAsc)[0]
export const peopleOf = (e: EventRec, contacts: Contact[]) => contacts.filter((c) => e.contactIds.includes(c.id))
export const eventsOf = (c: Contact, events: EventRec[]) => events.filter((e) => e.contactIds.includes(c.id)).sort(byDateDesc)
export const pct = (actual: number, expected: number | null) => (expected ? Math.round((actual / expected) * 100) : null)
