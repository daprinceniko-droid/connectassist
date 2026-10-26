import type { FloorPlan, PlanItem, PlanKind } from '../types'
import { uid } from './dates'
import { roomLayout, type RoomLayout } from './rooms'

export const KIND_META: Record<PlanKind, { name: string; w: number; h: number; seats?: number; label?: string }> = {
  round: { name: 'Round table', w: 110, h: 110, seats: 8 },
  long: { name: 'Long table', w: 200, h: 70, seats: 0, label: 'Long table' },
  sofa: { name: 'Sofa', w: 180, h: 60, seats: 3, label: 'Lounge' },
  stage: { name: 'Stage', w: 450, h: 130, label: 'DJ / Stage' },
  bar: { name: 'Bar', w: 300, h: 70, label: 'Bar' },
  plant: { name: 'Plant', w: 40, h: 40 },
  dj: { name: 'DJ booth', w: 150, h: 80, label: 'DJ' },
  door: { name: 'Door', w: 100, h: 8 },
  seating: { name: 'Seating block', w: 250, h: 400 },
  custom: { name: 'Custom element', w: 200, h: 100, label: 'Custom' },
}
export const PALETTE: PlanKind[] = ['round', 'long', 'sofa', 'stage', 'bar', 'plant', 'dj', 'door']
export const snap = (v: number) => Math.round(v / 10) * 10
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

export function newItem(kind: PlanKind, x: number, y: number, o: Partial<PlanItem> = {}): PlanItem {
  const m = KIND_META[kind]
  const it: PlanItem = { id: uid(), kind, x, y, w: m.w, h: m.h, rot: 0, ...o }
  if (m.seats !== undefined && o.seats === undefined) it.seats = m.seats
  if (kind === 'seating') { it.cols = o.cols ?? 5; it.rows = o.rows ?? 8; it.w = it.cols * 50; it.h = it.rows * 50 }
  return it
}
export const seatsOf = (i: PlanItem) => (i.kind === 'seating' ? (i.cols ?? 0) * (i.rows ?? 0) : i.seats ?? 0)
export function planStats(items: PlanItem[]) {
  let seats = 0, tables = 0, rows = 0
  for (const i of items) { seats += seatsOf(i); if (i.kind === 'round' || i.kind === 'long') tables++; if (i.kind === 'seating') rows += i.rows ?? 0 }
  return { seats, tables, rows }
}
export const statLabel = (items: PlanItem[]) => {
  const s = planStats(items)
  return s.rows > 0 ? `${s.seats} seats · ${s.rows} rows` : `${s.seats} seats · ${s.tables} table${s.tables === 1 ? '' : 's'}`
}
export const canvasLabel = (i: PlanItem) => i.label ?? KIND_META[i.kind].label ?? ''
export function itemName(i: PlanItem, items: PlanItem[]) {
  if (i.kind === 'round') return `Round table ${items.filter((x) => x.kind === 'round').findIndex((x) => x.id === i.id) + 1}`
  return i.label || KIND_META[i.kind].name
}
export const clampItem = (i: PlanItem, room: RoomLayout): PlanItem => ({ ...i, x: clamp(i.x, 0, room.w), y: clamp(i.y, 0, room.h) })
/** Same layout with fresh ids, so a copy never shares ids with its source. */
export const cloneItems = (items: PlanItem[]) => items.map((i) => ({ ...i, id: uid() }))
export const clonePlan = (p: FloorPlan): FloorPlan => ({ ...p, items: cloneItems(p.items) })

/* ---------- starter presets, generated to fit each room ---------- */
interface Box { x0: number; y0: number; x1: number; y1: number }
const boxOf = (cx: number, cy: number, w: number, h: number): Box => ({ x0: cx - w / 2, y0: cy - h / 2, x1: cx + w / 2, y1: cy + h / 2 })
const hit = (a: Box, b: Box) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0
const avoidBoxes = (r: RoomLayout): Box[] => r.fixed.map((f) => { const g = f.kind === 'entrance' ? 90 : 30; return { x0: f.x - g, y0: f.y - g, x1: f.x + f.w + g, y1: f.y + f.h + g } })

/** Fills a region with a grid, trying small shifts so the grid flows around pillars instead of losing seats. */
function fillGrid(reg: Box, iw: number, ih: number, gx: number, gy: number, maxC: number, maxR: number, avoid: Box[], make: (x: number, y: number) => PlanItem) {
  const rw = reg.x1 - reg.x0, rh = reg.y1 - reg.y0
  const cols = Math.min(maxC, Math.max(0, Math.floor((rw + gx) / (iw + gx))))
  const rows = Math.min(maxR, Math.max(0, Math.floor((rh + gy) / (ih + gy))))
  const sx = reg.x0 + (rw - (cols * iw + (cols - 1) * gx)) / 2, sy = reg.y0 + (rh - (rows * ih + (rows - 1) * gy)) / 2
  let best: [number, number][] = [], bestCost = Infinity
  for (let dx = -240; dx <= 240; dx += 20) for (let dy = -120; dy <= 120; dy += 20) {
    const pts: [number, number][] = []
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const cx = snap(sx + dx + c * (iw + gx) + iw / 2), cy = snap(sy + dy + r * (ih + gy) + ih / 2)
      const inside = cx - iw / 2 >= reg.x0 - 40 && cx + iw / 2 <= reg.x1 + 40 && cy - ih / 2 >= reg.y0 - 40 && cy + ih / 2 <= reg.y1 + 40
      if (inside && !avoid.some((a) => hit(a, boxOf(cx, cy, iw, ih)))) pts.push([cx, cy])
    }
    const cost = -pts.length * 1000 + Math.abs(dx) + Math.abs(dy)
    if (cost < bestCost) { bestCost = cost; best = pts }
  }
  return best.map(([x, y]) => make(x, y))
}

function stageAndRegion(room: RoomLayout) {
  const M = 80
  if (room.h >= 500) {
    const sw = Math.min(450, room.w * 0.32), sh = 130
    return { stage: newItem('stage', snap(M + sw / 2), snap(M + sh / 2), { w: sw, h: sh }), reg: { x0: M, y0: M + sh + 70, x1: room.w - M, y1: room.h - M - 60 } as Box, long: false }
  }
  // narrow rooms (the catwalk): stage sits just inside the left entrance, not on top of it
  const sh = Math.min(280, room.h - 2 * M), x = 300
  return { stage: newItem('stage', x, room.h / 2, { w: 130, h: sh }), reg: { x0: x + 65 + 70, y0: M, x1: room.w - 300, y1: room.h - M } as Box, long: true }
}

function theatre(reg: Box, avoid: Box[]): PlanItem[] {
  const rw = reg.x1 - reg.x0, rh = reg.y1 - reg.y0
  let best: PlanItem[] = [], bestScore = -1
  for (const aisle of [120, 200, 300]) for (let dx = -400; dx <= 400; dx += 40) {
    const cols = clamp(Math.floor((rw - aisle) / 2 / 50), 1, 6)
    const blocks: PlanItem[] = []
    for (const side of [-1, 1]) {
      const cx = snap(reg.x0 + rw / 2 + dx + side * (aisle / 2 + cols * 25))
      if (cx - cols * 25 < reg.x0 - 40 || cx + cols * 25 > reg.x1 + 40) continue
      for (let r = clamp(Math.floor(rh / 50), 1, 8); r >= 1; r--) {
        const cy = snap(reg.y0 + r * 25)
        if (!avoid.some((a) => hit(a, boxOf(cx, cy, cols * 50, r * 50)))) { blocks.push(newItem('seating', cx, cy, { cols, rows: r })); break }
      }
    }
    const score = blocks.length * 10000 + blocks.reduce((n, b) => n + seatsOf(b), 0) * 10 - Math.abs(dx) - aisle / 10
    if (score > bestScore) { bestScore = score; best = blocks }
  }
  return best
}

export const STARTERS = ['Cabaret', 'Theatre', 'Lounge party', 'Blank'] as const
export function starterItems(roomName: string, name: string): PlanItem[] {
  const room = roomLayout(roomName), { stage, reg, long } = stageAndRegion(room), avoid = avoidBoxes(room)
  if (name === 'Blank') return []
  if (name === 'Cabaret') return [stage, ...fillGrid(reg, 110, 110, 60, 60, 5, 3, avoid, (x, y) => newItem('round', x, y))]
  if (name === 'Theatre') return [stage, ...theatre(reg, avoid)]
  // Lounge party: DJ stage, a bar on a free wall, sofas on one side, small high tables on the other
  const out: PlanItem[] = [stage]
  const free = (it: PlanItem) => !avoid.some((a) => hit(a, boxOf(it.x, it.y, it.w, it.h)))
  const bh = long ? 400 : Math.min(420, room.h * 0.45)
  const bars = long
    ? [newItem('bar', snap(reg.x1 - 200), room.h - 115, { w: bh, h: 70 })]
    : [newItem('bar', room.w - 115, snap(reg.y0 + bh / 2), { w: 70, h: bh }), newItem('bar', 115, snap(reg.y0 + bh / 2), { w: 70, h: bh })]
  const bar = bars.find(free)
  let r = { ...reg }
  if (bar) { out.push(bar); if (!long) { if (bar.x > room.w / 2) r.x1 -= 150; else r.x0 += 150 } else r = { ...r, y1: r.y1 - 110 } }
  const rw = r.x1 - r.x0
  if (!long) {
    out.push(...fillGrid({ ...r, x1: r.x0 + rw * 0.5 }, 180, 60, 80, 70, 2, 3, avoid, (x, y) => newItem('sofa', x, y)))
    out.push(...fillGrid({ ...r, x0: r.x0 + rw * 0.55 }, 90, 90, 70, 70, 3, 3, avoid, (x, y) => newItem('round', x, y, { w: 90, h: 90, seats: 4 })))
  } else out.push(...fillGrid(r, 180, 60, 120, 60, 4, 2, avoid, (x, y) => newItem('sofa', x, y)))
  return out
}
export const starterPlan = (room: string, name: string): FloorPlan => ({ room, items: starterItems(room, name), basedOn: name })
