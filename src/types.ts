export const EVENT_TYPES = ['Live & DJ', 'Party', 'Coffee & Chill', 'Active', 'Other'] as const
export type EventType = (typeof EVENT_TYPES)[number]

export const CONTACT_CATEGORIES = ['DJ', 'Food', 'Drinks', 'Sponsor', 'Arts & Crafts', 'Other'] as const
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

export interface EventRec {
  id: string
  name: string
  date: string // YYYY-MM-DD
  time: string // HH:mm, doors open
  room: string
  type: EventType
  expectedGuests: number | null
  actualGuests: number | null
  rating: Rating | null
  reflection: string
  notes: string
  coverUrl: string | null
  needsFloorPlan: boolean
  floorPlan: FloorPlan | null
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
  room: string
  type: string
  expectedGuests: number | null
  notes: string
  needsFloorPlan: boolean
  schedule: ScheduleItem[]
  floorPlan: FloorPlan | null
  contacts: { name: string; category: string }[]
}

export type PlanKind = 'round' | 'long' | 'sofa' | 'stage' | 'bar' | 'plant' | 'dj' | 'door' | 'seating' | 'custom'
/** All sizes in centimetres; x/y are the item's centre. */
export interface PlanItem {
  id: string; kind: PlanKind; x: number; y: number; w: number; h: number; rot: number
  seats?: number; cols?: number; rows?: number; label?: string
}
export interface FloorPlan { room: string; items: PlanItem[]; basedOn?: string }
export interface Preset { id: string; name: string; room: string; items: PlanItem[]; createdAt: string }
