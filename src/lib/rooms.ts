/**
 * Room shapes for the floor plan builder, traced from Pawl's hand sketches. Sizes in centimetres.
 * The sketches have no scale, so overall sizes are ESTIMATES: replace w/h (and scale the features)
 * with real measurements and every plan redraws automatically.
 */
export type Side = 'top' | 'bottom' | 'left' | 'right'
export interface Fixed { id: string; label: string; kind: 'pillar' | 'storage' | 'fixture' | 'entrance'; x: number; y: number; w: number; h: number; side?: Side }
export interface Rect { x: number; y: number; w: number; h: number }
export interface RoomLayout {
  name: string; w: number; h: number; fixed: Fixed[]
  /** Walls of a non-rectangular room (corners in order). Without it the room is the w x h rectangle. */
  outline?: [number, number][]
  /** Parts of the w x h box that are outside the room (used so presets never place furniture there). */
  voids?: Rect[]
  /** Where the starter presets put the stage and furniture, for rooms where the default doesn't suit. */
  preset?: { stage: Rect; reg: { x0: number; y0: number; x1: number; y1: number }; long: boolean }
}

const T = 30 // thickness of the wall gap drawn for an entrance
const entrance = (W: number, H: number, side: Side, at: number, len: number): Fixed => {
  const base = { id: `ent-${side}-${at}`, label: 'Entrance', kind: 'entrance' as const, side }
  if (side === 'bottom') return { ...base, x: at - len / 2, y: H - T / 2, w: len, h: T }
  if (side === 'top') return { ...base, x: at - len / 2, y: -T / 2, w: len, h: T }
  if (side === 'left') return { ...base, x: -T / 2, y: at - len / 2, w: T, h: len }
  return { ...base, x: W - T / 2, y: at - len / 2, w: T, h: len }
}
const pillar = (id: string, cx: number, cy: number, d = 75): Fixed => ({ id, label: 'Pillar', kind: 'pillar', x: cx - d / 2, y: cy - d / 2, w: d, h: d })
const fx = (id: string, label: string, x: number, y: number, w: number, h: number, kind: Fixed['kind'] = 'fixture'): Fixed => ({ id, label, kind, x, y, w, h })

export const ROOM_LAYOUTS: RoomLayout[] = [
  { // sketch: bar (L-shape) lower left, kitchen lower right, lounge area top right, two pillars, door gap in the top wall
    name: 'Restaurant & Bar', w: 1800, h: 1020,
    fixed: [
      fx('unit', '', 0, 175, 114, 385),
      pillar('p1', 385, 359, 80), pillar('p2', 770, 364, 70),
      fx('bar1', 'Bar', 166, 578, 648, 122), fx('bar2', '', 662, 700, 157, 122),
      fx('lounge', 'Lounge area', 1383, 61, 367, 272),
      fx('kitchen', 'Kitchen', 1173, 464, 627, 556),
      fx('nook', '', 604, 936, 262, 84),
      entrance(1800, 1020, 'top', 1255, 200),
    ],
    preset: { stage: { x: 700, y: 195, w: 450, h: 130 }, reg: { x0: 200, y0: 300, x1: 1700, y1: 940 }, long: false },
  },
  { // sketch: screen on the top wall, a deep recess on each side wall, door bottom left
    name: 'Meeting Space 1', w: 800, h: 600,
    fixed: [
      fx('screen', 'Screen', 200, 6, 320, 40),
      fx('rl', '', 0, 92, 50, 344), fx('rr', '', 720, 82, 80, 360),
      entrance(800, 600, 'bottom', 132, 100),
    ],
    preset: { stage: { x: 400, y: 135, w: 320, h: 110 }, reg: { x0: 100, y0: 240, x1: 700, y1: 500 }, long: false },
  },
  { // sketch: two pillars mid-room, a recess on each side wall, a door at each end of the bottom wall, folding-wall ticks
    name: 'Meeting Space 2+3', w: 1500, h: 675,
    fixed: [
      fx('rl', '', 0, 122, 53, 337), fx('rr', '', 1447, 168, 53, 323),
      pillar('p1', 603, 438), pillar('p2', 867, 422),
      fx('fold-t', '', 762, 0, 10, 30), fx('fold-b', '', 762, 645, 10, 30),
      entrance(1500, 675, 'bottom', 122, 111), entrance(1500, 675, 'bottom', 1383, 100),
    ],
    preset: { stage: { x: 300, y: 150, w: 420, h: 120 }, reg: { x0: 100, y0: 250, x1: 1400, y1: 560 }, long: false },
  },
  { // sketch: a long corridor (door on the left, stairs up and down) opening into a wide hall on the right
    name: 'Catwalk', w: 2400, h: 951,
    outline: [[0, 238], [1916, 238], [1916, 0], [2400, 0], [2400, 951], [1924, 951], [1924, 740], [0, 740]],
    voids: [{ x: 0, y: 0, w: 1916, h: 238 }, { x: 0, y: 740, w: 1924, h: 211 }],
    fixed: [
      fx('stairs-up', 'Stairs', 238, 178, 312, 120), fx('stairs-down', 'Stairs', 238, 680, 312, 120),
      entrance(2400, 951, 'left', 481, 132),
    ],
    preset: { stage: { x: 230, y: 489, w: 130, h: 300 }, reg: { x0: 380, y0: 290, x1: 1880, y1: 690 }, long: true },
  },
  { // not sketched yet: placeholder
    name: 'Lobby', w: 1500, h: 900,
    fixed: [
      fx('rec', 'Reception', 1040, 50, 400, 90), fx('lift', 'Lift & stairs', 1260, 620, 200, 240),
      pillar('p1', 730, 450, 60), entrance(1500, 900, 'bottom', 750, 300),
    ],
  },
]
export const ROOM_NAMES = ROOM_LAYOUTS.map((r) => r.name)
export const roomLayout = (name: string): RoomLayout => ROOM_LAYOUTS.find((r) => r.name === name) ?? ROOM_LAYOUTS[0]

/** Is this point inside the room's walls? */
export function insideRoom(room: RoomLayout, x: number, y: number) {
  if (x < 0 || y < 0 || x > room.w || y > room.h) return false
  if (!room.outline) return true
  let inside = false
  const o = room.outline
  for (let i = 0, j = o.length - 1; i < o.length; j = i++) {
    const [xi, yi] = o[i], [xj, yj] = o[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}
