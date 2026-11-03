import type { ScheduleItem } from '../types'
import { uid } from './dates'

const pad = (n: number) => String(n).padStart(2, '0')
export function shiftTime(hhmm: string, minutes: number) {
  const [h, m] = hhmm.split(':').map(Number)
  const t = (((h * 60 + m + minutes) % 1440) + 1440) % 1440
  return `${pad(Math.floor(t / 60))}:${pad(t % 60)}`
}
/** Times just after midnight sort after the evening, so a 01:00 breakdown comes last. */
export const sortKey = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return (h < 5 ? h + 24 : h) * 60 + m }
export const sortSchedule = (s: ScheduleItem[]) => [...s].sort((a, b) => sortKey(a.time) - sortKey(b.time))

/** Minutes since midnight for an HH:mm string. */
export const toMinutes = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m }

/**
 * The only way a timeline gets filled in for you: a REUSED event copies the source event's timeline,
 * moved so it lines up with the new start time. New events start with an empty timeline.
 */
export function reuseSchedule(source: ScheduleItem[], fromStart: string, toStart: string): ScheduleItem[] {
  const delta = toMinutes(toStart) - toMinutes(fromStart)
  return sortSchedule(source.map((s) => ({ ...s, id: uid(), time: shiftTime(s.time, delta), auto: false })))
}

/** Standard building blocks Pawl can drop into a rundown (the "select elements" idea from the interview). */
export const STANDARD_ELEMENTS = [
  { label: 'DJ booth', title: 'DJ booth setup', owner: 'DJ', lead: -90 },
  { label: 'Welcome table', title: 'Welcome table setup', owner: 'Staff', lead: -45 },
  { label: 'Bar', title: 'Bar setup', owner: 'Bar', lead: -60 },
  { label: 'Catering', title: 'Catering arrives', owner: 'Kitchen', lead: -90 },
  { label: 'Photo wall', title: 'Photo wall setup', owner: 'Staff', lead: -45 },
  { label: 'Check-in desk', title: 'Check-in desk ready', owner: 'Front desk', lead: -30 },
]
