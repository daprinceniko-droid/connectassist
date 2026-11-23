export const EVENT_TYPES = ['NextGen', 'JIM', 'Rituals', 'Events', 'Other'] as const
export type EventType = (typeof EVENT_TYPES)[number]
/** Events saved before the type list changed ('Party', 'Live & DJ', ...) are shown as 'Events' instead of breaking. */
export const normalizeType = (t: string | null | undefined): EventType => ((EVENT_TYPES as readonly string[]).includes(t ?? '') ? (t as EventType) : 'Events')

export const CONTACT_CATEGORIES = ['DJ', 'Food', 'Drinks', 'Instructor', 'Sponsor', 'Arts & Crafts', 'Other'] as const
export type ContactCategory = (typeof CONTACT_CATEGORIES)[number]

export type Rating = 'Rough' | 'Okay' | 'Great'

export interface ScheduleItem {
  id: string
  time: string // HH:mm
  title: string
  owner: string
  highlight?: boolean
  auto?: boolean // generated from event details (false = added/edited by hand)
}

export interface Todo { id: string; text: string; done: boolean }

/** How a recurring event repeats. */
export type Repeat = 'weekly' | 'biweekly' | 'monthly'

export interface EventRec {
  id: string
  name: string
  date: string // start date, YYYY-MM-DD
  time: string // start time, HH:mm
  endDate: string | null // YYYY-MM-DD (null = same day)
  endTime: string | null // HH:mm
  room: string
  type: EventType
  expectedGuests: number | null
  actualGuests: number | null
  rating: Rating | null
  reflection: string
  notes: string
  foodBeverage: string // free text: "Event Food, Beverage & Extras"
  bookedBy: string
  seriesId: string | null // events created together as one recurring series share this id
  repeat: Repeat | null
  coverUrl: string | null
  needsFloorPlan: boolean
  floorPlan: FloorPlan | null
  floorPlans?: FloorPlan[]
  staffCount: number | null
  schedule: ScheduleItem[]
  todos: Todo[]
  contactIds: string[]
  shareToken: string | null
  isSample: boolean
  createdAt: string
}

export interface Contact {
  id: string
  name: string
  category: ContactCategory
  speciality: string
  email: string
  phone: string
  notes: string
  isSample: boolean
  createdAt: string
}

export interface SharedEvent {
  name: string
  date: string
  time: string
  endDate?: string | null
  endTime?: string | null
  bookedBy?: string
  foodBeverage?: string
  room: string
  type: string
  expectedGuests: number | null
  notes: string
  needsFloorPlan: boolean
  schedule: ScheduleItem[]
  floorPlan: FloorPlan | null
  floorPlans?: FloorPlan[]
  contacts: { name: string; category: string }[]
}

export type PlanKind = 'round' | 'long' | 'sofa' | 'stage' | 'bar' | 'plant' | 'dj' | 'door' | 'seating' | 'custom'
/** All sizes in centimetres; x/y are the item's centre. */
export interface PlanItem {
  id: string; kind: PlanKind; x: number; y: number; w: number; h: number; rot: number
  seats?: number; cols?: number; rows?: number; label?: string
}
export interface FloorPlan { room: string; name?: string; items: PlanItem[]; basedOn?: string }
export interface Preset { id: string; name: string; room: string; items: PlanItem[]; createdAt: string }
