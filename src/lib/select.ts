import type { Contact, EventRec } from '../types'
import { fmtLong, fmtShort, todayISO } from './dates'

export const isUpcoming = (e: EventRec) => e.date >= todayISO()
export const needsUpdate = (e: EventRec) => e.date < todayISO() && e.actualGuests == null
export const byDateDesc = (a: EventRec, b: EventRec) => (a.date === b.date ? b.time.localeCompare(a.time) : b.date.localeCompare(a.date))
export const byDateAsc = (a: EventRec, b: EventRec) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date))
export const nextUp = (events: EventRec[]) => events.filter(isUpcoming).sort(byDateAsc)[0]
export const peopleOf = (e: EventRec, contacts: Contact[]) => contacts.filter((c) => e.contactIds.includes(c.id))
export const eventsOf = (c: Contact, events: EventRec[]) => events.filter((e) => e.contactIds.includes(c.id)).sort(byDateDesc)
export const pct = (actual: number, expected: number | null) => (expected ? Math.round((actual / expected) * 100) : null)

/** Last day of the event (same as the start date for one-day events). */
export const lastDay = (e: EventRec) => (e.endDate && e.endDate > e.date ? e.endDate : e.date)
/** "6 Nov · 18:00 – 23:00" or, across days, "6 Nov 20:00 → 7 Nov 02:00". */
export const whenShort = (e: EventRec) => {
  if (lastDay(e) !== e.date) return `${fmtShort(e.date)} ${e.time} → ${fmtShort(lastDay(e))} ${e.endTime ?? ''}`.trim()
  return `${fmtShort(e.date)} · ${timeRange(e)}`
}
type When = { date: string; time: string; endDate?: string | null; endTime?: string | null }
/** "20:00 – 02:00", or just "20:00" when there is no end time. */
export const timeRange = (e: When) => `${e.time}${e.endTime ? ` – ${e.endTime}` : ''}`
/** "Fri 6 Nov 2026", or "Fri 6 Nov 2026 – Sat 7 Nov 2026" for events that run over several days. */
export const dateRange = (e: When) => (e.endDate && e.endDate > e.date ? `${fmtLong(e.date)} – ${fmtLong(e.endDate)}` : fmtLong(e.date))
export const whenFull = (e: When) =>
  e.endDate && e.endDate > e.date ? `${fmtLong(e.date)} ${e.time} → ${fmtLong(e.endDate)} ${e.endTime ?? ''}`.trim() : `${fmtLong(e.date)} · ${timeRange(e)}`
