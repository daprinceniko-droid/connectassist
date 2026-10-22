import type { Contact, EventRec, EventType } from '../types'
import { addDays, todayISO, uid } from '../lib/dates'
import { defaultTodos, generateSchedule } from '../lib/schedule'

/** Sample data, dated relative to today so nothing looks stale. All rows are flagged is_sample. */
export function buildSample(): { events: EventRec[]; contacts: Contact[] } {
  const now = new Date().toISOString()
  const mk = (name: string, category: Contact['category'], speciality: string, email: string, phone: string, notes: string): Contact =>
    ({ id: uid(), name, category, speciality, email, phone, notes, isSample: true, createdAt: now })
  const marlo = mk('Marlo Visser', 'DJ', 'House & disco', 'marlo@example.com', '+31 6 12 34 56 78', 'Prefers two weeks’ notice. Brings own controller.')
  const sofia = mk('Sofia Ramos', 'DJ', 'Latin & afrobeats', 'sofia@example.com', '+31 6 98 76 54 32', '')
  const luna = mk('Luna Catering', 'Food', 'Finger food & buffets', 'hello@luna.example.com', '+31 70 123 45 67', '')
  const harbour = mk('Harbour Brewery', 'Drinks', 'Craft beer supplier', 'orders@harbour.example.com', '+31 70 765 43 21', '')
  const art = mk('Art Aydan', 'Sponsor', 'Arts & crafts workshops', 'art@example.com', '', 'Sponsor of Paint the Tote Bag.')
  const kiki = mk('Kiki Fontaine', 'Arts & Crafts', 'Pottery & painting', 'kiki@example.com', '+31 6 11 22 33 44', '')
  const contacts = [marlo, sofia, luna, harbour, art, kiki]

  const ev = (o: { name: string; off: number; time: string; room: string; type: EventType; exp: number; act?: number; rating?: EventRec['rating']; refl?: string; staff?: number; people: Contact[]; fp?: boolean; notes?: string }): EventRec => {
    const hasDJ = o.people.some((p) => p.category === 'DJ')
    const needsFloorPlan = o.fp ?? o.type !== 'Active'
    return {
      id: uid(), name: o.name, date: addDays(todayISO(), o.off), time: o.time, room: o.room, type: o.type,
      expectedGuests: o.exp, actualGuests: o.act ?? null, rating: o.rating ?? null, reflection: o.refl ?? '',
      notes: o.notes ?? '', coverUrl: null, needsFloorPlan, floorPlan: null, staffCount: o.staff ?? null,
      schedule: generateSchedule({ type: o.type, time: o.time, hasDJ, needsFloorPlan }),
      todos: o.off >= 0 ? defaultTodos({ type: o.type, needsFloorPlan, hasDJ }) : [],
      contactIds: o.people.map((p) => p.id), shareToken: null, isSample: true, createdAt: now,
    }
  }
  const events = [
    ev({ name: 'Welcome Party', off: 5, time: '18:00', room: 'Meeting Space 2+3', type: 'Party', exp: 60, people: [luna], notes: 'Make posters for the entrance.\n\nCheck sound with the DJ before doors open.' }),
    ev({ name: 'Student Welcome Event', off: -12, time: '18:00', room: 'Restaurant', type: 'Party', exp: 180, staff: 17, people: [sofia, luna, harbour], notes: 'Biggest event of the month. Full BOE and event script were used.' }),
    ev({ name: 'Founders Coworking Night', off: -22, time: '17:30', room: 'Winter Garden', type: 'Coffee & Chill', exp: 70, act: 64, rating: 'Great', refl: 'Good mix of members and guests.', staff: 4, people: [luna] }),
    ev({ name: 'Open Decks Friday', off: -29, time: '20:00', room: 'Restaurant', type: 'Live & DJ', exp: 120, act: 110, rating: 'Great', refl: 'Sound check ran late; start it earlier next time.', staff: 8, people: [marlo, harbour] }),
    ev({ name: 'Sunrise Run Club', off: -36, time: '07:00', room: 'Off-site', type: 'Active', exp: 30, act: 32, rating: 'Okay', staff: 1, people: [] }),
    ev({ name: 'Rooftop Social', off: -44, time: '18:30', room: 'Rooftop', type: 'Party', exp: 100, act: 90, rating: 'Great', staff: 9, people: [marlo, harbour, luna] }),
    ev({ name: 'Paint the Tote Bag', off: -50, time: '16:00', room: 'Meeting Space 1', type: 'Other', exp: 25, act: 24, rating: 'Great', staff: 2, people: [art, kiki], fp: false }),
    ev({ name: 'Live Acoustic Night', off: -58, time: '19:30', room: 'Winter Garden', type: 'Live & DJ', exp: 80, act: 75, rating: 'Okay', staff: 5, people: [harbour] }),
    ev({ name: 'City Walk & Talk', off: -66, time: '14:00', room: 'Off-site', type: 'Active', exp: 25, act: 24, rating: 'Great', staff: 1, people: [] }),
  ]
  return { events, contacts }
}
