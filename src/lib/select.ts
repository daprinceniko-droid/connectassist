import type { Contact, EventRec } from '../types'
import { fmtFull, fmtShort, todayISO } from './dates'

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
/** "Sep 5 · 18:00 – 23:00" or, across days, "Sep 5 18:00 → Sep 6 02:00". */
export const whenShort = (e: EventRec) => {
  const multi = lastDay(e) !== e.date
  if (multi) return `${fmtShort(e.date)} ${e.time} → ${fmtShort(lastDay(e))} ${e.endTime ?? ''}`.trim()
  return `${fmtShort(e.date)} · ${e.time}${e.endTime ? ` – ${e.endTime}` : ''}`
}
export const whenFull = (e: { date: string; time: string; endDate?: string | null; endTime?: string | null }) => {
  const multi = e.endDate && e.endDate > e.date
  if (multi) return `${fmtFull(e.date)} ${e.time} → ${fmtFull(e.endDate!)} ${e.endTime ?? ''}`.trim()
  return `${fmtFull(e.date)} · ${e.time}${e.endTime ? ` – ${e.endTime}` : ''}`
}
