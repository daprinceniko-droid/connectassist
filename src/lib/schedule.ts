import type { EventType, ScheduleItem, Todo } from '../types'
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

interface Ctx { hasDJ: boolean; type: EventType }
interface Block { offset: number; title: string; owner: string; highlight?: boolean; when?: (c: Ctx) => boolean }

const PARTY: Block[] = [
  { offset: -180, title: 'Setup', owner: 'Pawl · Staff' },
  { offset: -120, title: 'Sound check', owner: 'DJ', when: (c) => c.hasDJ || c.type === 'Live & DJ' },
  { offset: -60, title: 'Staff briefing', owner: 'Pawl' },
  { offset: 0, title: 'Doors open', owner: 'Front desk' },
  { offset: 30, title: 'Welcome speech', owner: 'Pawl' },
  { offset: 60, title: 'DJ set', owner: 'DJ', highlight: true, when: (c) => c.hasDJ },
  { offset: 60, title: 'Live act', owner: 'Artist', highlight: true, when: (c) => !c.hasDJ && c.type === 'Live & DJ' },
  { offset: 60, title: 'Main programme', owner: 'Pawl', highlight: true, when: (c) => !c.hasDJ && c.type === 'Party' },
  { offset: 240, title: 'Last call', owner: 'Bar' },
  { offset: 300, title: 'Doors close & breakdown', owner: 'All staff' },
]
const TEMPLATES: Record<EventType, Block[]> = {
  Party: PARTY,
  'Live & DJ': PARTY.filter((b) => b.title !== 'Welcome speech'),
  'Coffee & Chill': [
    { offset: -60, title: 'Setup', owner: 'Pawl · Staff' },
    { offset: 0, title: 'Doors open', owner: 'Front desk' },
    { offset: 15, title: 'Host welcome', owner: 'Pawl', highlight: true },
    { offset: 150, title: 'Wrap-up & clean-up', owner: 'All staff' },
  ],
  Active: [
    { offset: -30, title: 'Prep & materials', owner: 'Pawl' },
    { offset: 0, title: 'Meet & greet', owner: 'Pawl' },
    { offset: 15, title: 'Activity starts', owner: 'Pawl', highlight: true },
    { offset: 75, title: 'Cool-down & social', owner: 'Pawl' },
    { offset: 105, title: 'Wrap-up', owner: 'Pawl' },
  ],
  Other: [
    { offset: -60, title: 'Setup', owner: 'Pawl · Staff' },
    { offset: -30, title: 'Staff briefing', owner: 'Pawl' },
    { offset: 0, title: 'Doors open', owner: 'Front desk', highlight: true },
    { offset: 120, title: 'Wrap-up & breakdown', owner: 'All staff' },
  ],
}

export function generateSchedule(o: { type: EventType; time: string; hasDJ: boolean; needsFloorPlan: boolean }): ScheduleItem[] {
  const ctx: Ctx = { hasDJ: o.hasDJ, type: o.type }
  return sortSchedule(
    TEMPLATES[o.type]
      .filter((b) => !b.when || b.when(ctx))
      .map((b) => ({
        id: uid(),
        time: shiftTime(o.time, b.offset),
        title: b.title === 'Setup' && o.needsFloorPlan ? 'Setup & floor plan' : b.title,
        owner: b.owner,
        highlight: b.highlight,
        auto: true,
      })),
  )
}

export function defaultTodos(o: { type: EventType; needsFloorPlan: boolean; hasDJ: boolean }): Todo[] {
  const t: Todo[] = []
  if (o.needsFloorPlan) t.push({ id: uid(), text: 'Floor plan', done: false })
  t.push({ id: uid(), text: 'Make posters', done: false })
  if ((o.type === 'Party' || o.type === 'Live & DJ') && !o.hasDJ) t.push({ id: uid(), text: 'Confirm DJ', done: false })
  return t
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
