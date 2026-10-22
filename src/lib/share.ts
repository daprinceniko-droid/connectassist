import type { Contact, EventRec, SharedEvent } from '../types'
import { peopleOf } from './select'

/** What a staff member may see: no contact details, no reflection or ratings. */
export const toShared = (e: EventRec, contacts: Contact[]): SharedEvent => ({
  name: e.name, date: e.date, time: e.time, room: e.room, type: e.type, expectedGuests: e.expectedGuests,
  notes: e.notes, needsFloorPlan: e.needsFloorPlan, schedule: e.schedule,
  contacts: peopleOf(e, contacts).map((c) => ({ name: c.name, category: c.category })),
})
export const shareUrl = (token: string) => `${window.location.origin}/s/${token}`
