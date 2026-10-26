import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { db } from '../data/db'
import { downloadRundownPdf } from '../lib/pdf'
import { fmtFull } from '../lib/dates'
import PlanSvg from '../components/PlanSvg'
import { statLabel } from '../lib/plan'
import type { SharedEvent } from '../types'

/** Public, read-only rundown for staff. No login, no contact details. */
export default function Shared() {
  const { token = '' } = useParams()
  const [e, setE] = useState<SharedEvent | null | undefined>(undefined)
  useEffect(() => { db.getShared(token).then(setE).catch(() => setE(null)) }, [token])
  if (e === undefined) return <div className="splash">Loading rundown…</div>
  if (!e) return <div className="center"><div className="login"><h1>Link not available</h1><p className="subtitle">This rundown link is no longer active. Ask Pawl for a new one.</p></div></div>
  const dj = e.contacts.filter((c) => c.category === 'DJ').map((c) => c.name)
  const vendors = e.contacts.filter((c) => c.category !== 'DJ').map((c) => c.name)
  return (
    <div className="shared">
      <span className="eyebrow">Rundown · The Social Hub The Hague</span>
      <h1 style={{ marginTop: 14 }}>{e.name}</h1>
      <p className="subtitle" style={{ marginBottom: 28 }}>{fmtFull(e.date)} · doors {e.time} · {e.room}</p>
      <button className="btn primary" style={{ marginBottom: 28 }} onClick={() => downloadRundownPdf(e)}>Download PDF</button>
      <section className="card"><div className="card-head"><span className="eyebrow">Schedule</span></div>
        <div className="rows">{e.schedule.map((s) => <div key={s.id} className={`row ${s.highlight ? 'hl' : ''}`}><b>{s.time}</b><span>{s.title}</span><span className="o">{s.owner}</span></div>)}</div></section>
      {e.floorPlan && e.needsFloorPlan && (
        <section className="card" style={{ marginTop: 20 }}><div className="card-head"><span className="eyebrow">Floor plan</span><span className="pill">{statLabel(e.floorPlan.items).split(' · ')[0]}</span></div>
          <div className="fp-box"><PlanSvg plan={e.floorPlan} /></div></section>)}
      <section className="card" style={{ marginTop: 20 }}><div className="card-head"><span className="eyebrow">Key details</span></div>
        <div className="kv"><span>Guests expected</span><span>{e.expectedGuests ?? 'To be confirmed'}</span></div>
        <div className="kv"><span>DJ</span><span>{dj.join(', ') || 'To be confirmed'}</span></div>
        <div className="kv"><span>Vendors</span><span>{vendors.join(', ') || 'None'}</span></div>
        <div className="kv"><span>Room</span><span>{e.room}</span></div></section>
      {e.notes.trim() && <section className="card" style={{ marginTop: 20 }}><div className="card-head"><span className="eyebrow">Notes</span></div><div className="white-box">{e.notes}</div></section>}
    </div>
  )
}
