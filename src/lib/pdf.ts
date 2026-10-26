import type { jsPDF } from 'jspdf'
import type { FloorPlan, PlanItem, SharedEvent } from '../types'
import { fmtFull } from './dates'
import { roomLayout } from './rooms'
import { canvasLabel, statLabel } from './plan'

/** Client-side A4 rundown PDF. No server needed; works from the app and from the public share page. */
export async function downloadRundownPdf(e: SharedEvent) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210, L = 18, R = W - 18
  let y = 22
  const ink: [number, number, number] = [10, 10, 10]
  const grey: [number, number, number] = [138, 138, 138]
  const band: [number, number, number] = [243, 243, 243]
  const ensure = (h: number) => { if (y + h > 280) { doc.addPage(); y = 22 } }
  const label = (t: string) => { ensure(10); doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...grey); doc.text(t.toUpperCase(), L, y, { charSpace: 0.6 }); y += 6 }

  doc.setFont('helvetica', 'bold'); doc.setFontSize(26); doc.setTextColor(...ink)
  const title = doc.splitTextToSize(e.name, R - L) as string[]
  doc.text(title, L, y); y += title.length * 10
  doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(...grey)
  doc.text([fmtFull(e.date), `doors ${e.time}`, e.room, e.type].filter(Boolean).join('  ·  '), L, y); y += 12

  label('Schedule')
  e.schedule.forEach((s, i) => {
    ensure(10)
    if (s.highlight) { doc.setFillColor(...ink) } else { doc.setFillColor(...band) }
    doc.roundedRect(L, y - 5.4, R - L, 9, 2.5, 2.5, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...(s.highlight ? ([255, 255, 255] as [number, number, number]) : ink))
    doc.text(s.time, L + 4, y)
    doc.setFont('helvetica', s.highlight ? 'bold' : 'normal'); doc.text(s.title, L + 24, y)
    doc.setFontSize(9); doc.setTextColor(...(s.highlight ? ([200, 200, 200] as [number, number, number]) : grey))
    doc.text(s.owner, R - 4, y, { align: 'right' })
    y += 11; void i
  })
  y += 4

  label('Key details')
  const dj = e.contacts.filter((c) => c.category === 'DJ').map((c) => c.name)
  const vendors = e.contacts.filter((c) => c.category !== 'DJ').map((c) => c.name)
  const rows: [string, string][] = [
    ['Guests expected', e.expectedGuests != null ? String(e.expectedGuests) : 'To be confirmed'],
    ['DJ', dj.join(', ') || 'To be confirmed'],
    ['Vendors', vendors.join(', ') || 'None'],
    ['Room', e.room || '—'],
  ]
  rows.forEach(([k, v]) => {
    ensure(9)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...grey); doc.text(k, L, y)
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...ink); doc.text(v, R, y, { align: 'right', maxWidth: 110 })
    doc.setDrawColor(225, 225, 225); doc.line(L, y + 3, R, y + 3)
    y += 9
  })
  y += 5

  if (e.notes.trim()) {
    label('Notes')
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(...ink)
    for (const line of doc.splitTextToSize(e.notes, R - L) as string[]) { ensure(6); doc.text(line, L, y); y += 5.6 }
  }

  if (e.floorPlan && e.needsFloorPlan) {
    doc.addPage(); y = 22
    label('Floor plan')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(...ink); doc.text(e.floorPlan.room, L, y); y += 5
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...grey)
    doc.text([e.floorPlan.basedOn, statLabel(e.floorPlan.items)].filter(Boolean).join('  ·  '), L, y); y += 6
    drawPlan(doc, e.floorPlan, L, y, R - L, 200)
  }

  const n = doc.getNumberOfPages()
  for (let p = 1; p <= n; p++) {
    doc.setPage(p); doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...grey)
    doc.text('Rundown · The Social Hub The Hague · made with ConnectAssist', L, 290)
    doc.text(`${p} / ${n}`, R, 290, { align: 'right' })
  }
  doc.save(`Rundown - ${e.name.replace(/[^\w\- ]+/g, '')} - ${e.date}.pdf`)
}


type RGB = [number, number, number]
const rot = (cx: number, cy: number, px: number, py: number, deg: number): [number, number] => {
  const r = (deg * Math.PI) / 180
  return [cx + px * Math.cos(r) - py * Math.sin(r), cy + px * Math.sin(r) + py * Math.cos(r)]
}
function polygon(doc: jsPDF, pts: [number, number][], style: string) {
  doc.lines(pts.slice(1).map((p, i) => [p[0] - pts[i][0], p[1] - pts[i][1]]), pts[0][0], pts[0][1], [1, 1], style, true)
}

/** Draws a floor plan as vector shapes inside the given box (mm). Returns the drawn size. */
export function drawPlan(doc: jsPDF, plan: FloorPlan, x0: number, y0: number, maxW: number, maxH: number) {
  const room = roomLayout(plan.room), pad = 20
  const k = Math.min(maxW / (room.w + pad * 2), maxH / (room.h + pad * 2)) // mm per cm
  const X = (v: number) => x0 + (pad + v) * k, Y = (v: number) => y0 + (pad + v) * k
  const fs = (cm: number) => Math.max(4.5, Math.min(11, cm * k * 2.835))
  const ink: RGB = [10, 10, 10]
  doc.setLineWidth(0.7); doc.setDrawColor(...ink); doc.setFillColor(255, 255, 255)
  doc.roundedRect(X(0), Y(0), room.w * k, room.h * k, 3, 3, 'FD')
  doc.setFont('helvetica', 'normal')
  for (const f of room.fixed) {
    if (f.kind === 'entrance') {
      doc.setFillColor(255, 255, 255); doc.rect(X(f.x), Y(f.y), f.w * k, f.h * k, 'F')
      doc.setFontSize(fs(22)); doc.setTextColor(138, 138, 138)
      const cx = X(f.x + f.w / 2), cy = Y(f.y + f.h / 2)
      if (f.side === 'bottom') doc.text('Entrance', cx, Y(f.y) - 1.5, { align: 'center' })
      else if (f.side === 'top') doc.text('Entrance', cx, Y(f.y + f.h) + 4, { align: 'center' })
      else if (f.side === 'left') doc.text('Entrance', X(f.x + f.w) + 1.5, cy, { align: 'left' })
      else doc.text('Entrance', X(f.x) - 1.5, cy, { align: 'right' })
      continue
    }
    doc.setLineWidth(0.25); doc.setLineDashPattern([1.2, 1.2], 0); doc.setDrawColor(170, 170, 170); doc.setFillColor(236, 236, 236)
    doc.rect(X(f.x), Y(f.y), f.w * k, f.h * k, 'FD'); doc.setLineDashPattern([], 0)
    if (f.kind !== 'pillar') { doc.setFontSize(fs(20)); doc.setTextColor(138, 138, 138); doc.text(f.label, X(f.x + f.w / 2), Y(f.y + f.h / 2), { align: 'center', baseline: 'middle', angle: f.h > f.w * 1.8 ? 90 : 0 }) }
  }
  let n = 0
  for (const it of plan.items as PlanItem[]) {
    const cx = X(it.x), cy = Y(it.y), w = it.w * k, h = Math.max(it.h, it.kind === 'door' ? 8 : 0) * k
    const rect = (style: string) => polygon(doc, ([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]] as [number, number][]).map(([px, py]) => rot(cx, cy, px, py, it.rot)), style)
    const label = canvasLabel(it)
    const text = (c: RGB, size = 22) => { if (label) { doc.setFontSize(fs(size)); doc.setTextColor(...c); doc.text(label, cx, cy, { align: 'center', baseline: 'middle', angle: it.h > it.w * 1.8 ? 90 : 0 }) } }
    doc.setLineWidth(0.4); doc.setDrawColor(...ink)
    switch (it.kind) {
      case 'round': n++; doc.setFillColor(255, 255, 255); doc.circle(cx, cy, w / 2, 'FD'); doc.setFontSize(fs(it.w * 0.24)); doc.setTextColor(...ink); doc.text(String(n), cx, cy, { align: 'center', baseline: 'middle' }); break
      case 'long': doc.setFillColor(255, 255, 255); rect('FD'); text([138, 138, 138]); break
      case 'sofa': doc.setFillColor(217, 217, 217); rect('F'); text([34, 34, 34], 20); break
      case 'stage': doc.setFillColor(...ink); rect('F'); text([255, 255, 255], 26); break
      case 'bar': doc.setFillColor(225, 225, 225); rect('F'); text(ink, 22); break
      case 'plant': doc.setFillColor(217, 217, 217); doc.circle(cx, cy, w / 2, 'F'); doc.setFillColor(138, 138, 138); doc.circle(cx, cy, w * 0.16, 'F'); break
      case 'dj': doc.setFillColor(255, 255, 255); rect('FD'); text(ink, 22); break
      case 'door': doc.setFillColor(...ink); rect('F'); break
      case 'seating': {
        doc.setFillColor(255, 255, 255); doc.setLineWidth(0.25)
        for (let r = 0; r < (it.rows ?? 0); r++) for (let c = 0; c < (it.cols ?? 0); c++) {
          const [px, py] = rot(cx, cy, (-it.w / 2 + 25 + c * 50) * k, (-it.h / 2 + 25 + r * 50) * k, it.rot)
          doc.circle(px, py, 18 * k, 'FD')
        }
        break
      }
      default: doc.setFillColor(255, 255, 255); doc.setLineDashPattern([1.2, 1.2], 0); rect('FD'); doc.setLineDashPattern([], 0); text(ink, 20)
    }
  }
  return { w: (room.w + pad * 2) * k, h: (room.h + pad * 2) * k }
}

export async function downloadFloorPlanPdf(eventName: string, date: string, plan: FloorPlan) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(10, 10, 10); doc.text(`Floor plan · ${eventName}`, 15, 20)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(138, 138, 138)
  doc.text([fmtFull(date), plan.room, plan.basedOn, statLabel(plan.items)].filter(Boolean).join('  ·  '), 15, 28)
  drawPlan(doc, plan, 15, 34, 267, 150)
  doc.setFontSize(8); doc.text('Floor plan · The Social Hub The Hague · made with ConnectAssist · room outlines are approximate', 15, 200)
  doc.save(`Floor plan - ${eventName.replace(/[^\w\- ]+/g, '')} - ${date}.pdf`)
}
