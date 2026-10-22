import type { SharedEvent } from '../types'
import { fmtFull } from './dates'

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

  const n = doc.getNumberOfPages()
  for (let p = 1; p <= n; p++) {
    doc.setPage(p); doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...grey)
    doc.text('Rundown · The Social Hub The Hague · made with ConnectAssist', L, 290)
    doc.text(`${p} / ${n}`, R, 290, { align: 'right' })
  }
  doc.save(`Rundown - ${e.name.replace(/[^\w\- ]+/g, '')} - ${e.date}.pdf`)
}
