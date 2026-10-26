/**
 * Room shapes for the floor plan builder. All sizes in centimetres.
 * NOTE: these are ESTIMATES. Replace w/h and the fixed blocks with real measurements
 * (tape measure or the building's CAD plan) and every plan updates automatically.
 */
export type Side = 'top' | 'bottom' | 'left' | 'right'
export interface Fixed { id: string; label: string; kind: 'pillar' | 'storage' | 'fixture' | 'entrance'; x: number; y: number; w: number; h: number; side?: Side }
export interface RoomLayout { name: string; w: number; h: number; fixed: Fixed[] }

const T = 30 // thickness of the wall gap drawn for an entrance
const entrance = (W: number, H: number, side: Side, at: number, len: number): Fixed => {
  const base = { id: `ent-${side}-${at}`, label: 'Entrance', kind: 'entrance' as const, side }
  if (side === 'bottom') return { ...base, x: at - len / 2, y: H - T / 2, w: len, h: T }
  if (side === 'top') return { ...base, x: at - len / 2, y: -T / 2, w: len, h: T }
  if (side === 'left') return { ...base, x: -T / 2, y: at - len / 2, w: T, h: len }
  return { ...base, x: W - T / 2, y: at - len / 2, w: T, h: len }
}
const pillar = (id: string, x: number, y: number): Fixed => ({ id, label: 'Pillar', kind: 'pillar', x, y, w: 60, h: 60 })

export const ROOM_LAYOUTS: RoomLayout[] = [
  { name: 'Restaurant & Bar', w: 1800, h: 1000, fixed: [
    { id: 'bar', label: 'Bar counter', kind: 'fixture', x: 1650, y: 120, w: 110, h: 520 },
    pillar('p1', 700, 480), pillar('p2', 1100, 480), entrance(1800, 1000, 'bottom', 900, 300)] },
  { name: 'Meeting Space 1', w: 800, h: 600, fixed: [
    { id: 'st', label: 'Storage', kind: 'storage', x: 640, y: 20, w: 140, h: 110 }, entrance(800, 600, 'bottom', 400, 140)] },
  { name: 'Meeting Space 2+3', w: 1400, h: 700, fixed: [
    pillar('p1', 650, 320), { id: 'st', label: 'Storage', kind: 'storage', x: 1260, y: 20, w: 120, h: 200 }, entrance(1400, 700, 'bottom', 700, 260)] },
  { name: 'Catwalk', w: 2400, h: 450, fixed: [
    { ...pillar('p1', 1000, 20), w: 50, h: 50 }, { ...pillar('p2', 1000, 380), w: 50, h: 50 },
    entrance(2400, 450, 'left', 225, 150), entrance(2400, 450, 'right', 225, 150)] },
  { name: 'Lobby', w: 1500, h: 900, fixed: [
    { id: 'rec', label: 'Reception', kind: 'fixture', x: 1040, y: 50, w: 400, h: 90 },
    { id: 'lift', label: 'Lift & stairs', kind: 'fixture', x: 1260, y: 620, w: 200, h: 240 },
    pillar('p1', 700, 420), entrance(1500, 900, 'bottom', 750, 300)] },
]
export const ROOM_NAMES = ROOM_LAYOUTS.map((r) => r.name)
export const roomLayout = (name: string): RoomLayout => ROOM_LAYOUTS.find((r) => r.name === name) ?? ROOM_LAYOUTS[0]
