import type { EventRec, Repeat } from '../types'
import { addDays, addMonths, daysBetween, uid } from './dates'
import { clonePlan } from './plan'

export const REPEAT_OPTIONS: { value: Repeat; label: string; every: string }[] = [
  { value: 'weekly', label: 'Every week', every: 'every week' },
  { value: 'biweekly', label: 'Every 2 weeks', every: 'every 2 weeks' },
  { value: 'monthly', label: 'Every month', every: 'every month' },
]
export const repeatEvery = (r: Repeat) => REPEAT_OPTIONS.find((o) => o.value === r)!.every
/** Most events created in one go, so a typo in the end date can't create hundreds. More can be added later. */
export const MAX_OCCURRENCES = 52
export const EXTEND_BY = 12

/** The date of occurrence number k (0 = the first one). Months are counted from the anchor so 31 Jan -> 28 Feb -> 31 Mar. */
export const dateAt = (anchor: string, rule: Repeat, k: number) =>
  rule === 'monthly' ? addMonths(anchor, k) : addDays(anchor, k * (rule === 'weekly' ? 7 : 14))

/** All dates from `anchor` up to and including `until`. Stops a little past the maximum so callers can detect "too many". */
export function seriesDates(anchor: string, rule: Repeat, until: string): string[] {
  const out: string[] = []
  for (let k = 0; k <= MAX_OCCURRENCES; k++) { const d = dateAt(anchor, rule, k); if (d > until) break; out.push(d) }
  return out
}
/** The default "repeat until": 12 occurrences. */
export const defaultUntil = (anchor: string, rule: Repeat) => dateAt(anchor, rule, 11)

/** The next `n` dates after `after`. Used by "Add 12 more". */
export function nextDates(anchor: string, rule: Repeat, after: string, n: number): string[] {
  const out: string[] = []
  for (let k = 1; out.length < n && k < 1000; k++) { const d = dateAt(anchor, rule, k); if (d > after) out.push(d) }
  return out
}

/**
 * A fresh copy of `src` on another date: same room, vendors, timeline, floor plan, food & beverage and notes,
 * but nothing that belongs to one specific night (guest counts, rating, reflection, staff, share link, to-do ticks, cover photo).
 */
export function cloneOccurrence(src: EventRec, date: string, seriesId: string, repeat: Repeat): EventRec {
  const off = daysBetween(src.date, date)
  return {
    ...src,
    id: uid(), date, endDate: src.endDate ? addDays(src.endDate, off) : null,
    actualGuests: null, rating: null, reflection: '', staffCount: null, shareToken: null, coverUrl: null, isSample: false,
    schedule: src.schedule.map((s) => ({ ...s, id: uid() })),
    todos: src.todos.map((t) => ({ ...t, id: uid(), done: false })),
    floorPlan: src.floorPlan ? clonePlan(src.floorPlan) : null,
    floorPlans: src.floorPlans?.map(clonePlan),
    seriesId, repeat, createdAt: new Date().toISOString(),
  }
}
