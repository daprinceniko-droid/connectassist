import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../state/StoreProvider'
import { Back } from '../components/ui'
import NotesBox from '../components/NotesBox'
import { fmtFull, fmtShort } from '../lib/dates'
import { isUpcoming, needsUpdate, pct, peopleOf } from '../lib/select'

export default function EventPage() {
  const { id } = useParams()
  const { events, contacts, patchEvent } = useStore()
  const [editStaff, setEditStaff] = useState(false)
  const e = events.find((x) => x.id === id)
  if (!e) return <div className="page"><Back to="/gallery" label="Gallery" /><p className="subtitle" style={{ marginTop: 24 }}>That event no longer exists.</p></div>

  const people = peopleOf(e, contacts)
  const djs = people.filter((p) => p.category === 'DJ')
  const vendors = people.filter((p) => p.category !== 'DJ')
  const logged = e.actualGuests != null
  const share = logged ? pct(e.actualGuests!, e.expectedGuests) : null
  const upcoming = isUpcoming(e)
  const chips = (list: typeof people) => list.length ? list.map((p) => <Link key={p.id} className="pill link" to={`/contacts?c=${p.id}`}>{p.name}</Link>) : <span style={{ fontWeight: 400, color: '#8a8a8a' }}>None</span>

  return (
    <div className="page">
      <Back to="/gallery" label="Gallery" />
      <div className="head" style={{ marginTop: 6 }}>
        <div>
          <h1 className="title" style={{ marginBottom: 8 }}>{e.name}</h1>
          <p className="subtitle">{fmtShort(e.date)} · {e.room} · {e.type}</p>
        </div>
        <div className="actions">
          <Link className="btn" to={`/events/${e.id}/rundown`}>Rundown</Link>
          {e.needsFloorPlan && <Link className="btn" to={`/events/${e.id}/floorplan`}>Floor plan</Link>}
          <Link className="btn" to={`/events/${e.id}/edit`}>Edit</Link>
          <Link className="btn primary" to={`/events/new?from=${e.id}`}>Reuse this event</Link>
        </div>
      </div>

      <div className="event-grid">
        <section className="card dark" aria-label="Attendance" style={{ minHeight: 520, display: 'flex', flexDirection: 'column' }}>
          <div className="card-head"><span className="eyebrow">Attendance</span>
            {logged ? <span className="pill">Logged</span> : needsUpdate(e) ? <span className="pill">Needs update</span> : <span className="pill">{upcoming ? 'Upcoming' : 'Today'}</span>}</div>
          {logged ? <div className="big-num">{e.actualGuests}</div> : <div className="big-dash" aria-hidden />}
          <p className="muted" style={{ margin: '0 0 16px', fontSize: 18 }}>
            {logged ? `${share != null ? `${share}% showed up · ` : ''}${e.expectedGuests ?? '—'} expected` : `Actual guests not logged yet · ${e.expectedGuests ?? '—'} expected`}
          </p>
          <div className="bar" role="progressbar" aria-valuenow={Math.min(100, share ?? 0)} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${Math.min(100, share ?? 0)}%` }} /></div>
          <hr className="rule" />
          <span className="eyebrow" style={{ color: '#a8a8a8' }}>Post-event update</span>
          {logged ? (
            <>
              <p>{e.rating ? <b style={{ color: '#fff' }}>{e.rating}. </b> : null}{e.reflection || 'No reflection added.'}</p>
              <div style={{ marginTop: 'auto' }}><Link className="btn white" to={`/events/${e.id}/update`}>Edit update</Link></div>
            </>
          ) : (
            <>
              <p>{upcoming ? 'After the event, add the real guest count and a short reflection so the archive stays accurate.' : 'Add the real guest count and a short reflection so the archive stays accurate.'}</p>
              {!upcoming && <div style={{ marginTop: 'auto' }}><Link className="btn white" to={`/events/${e.id}/update`}>Log actual guests</Link></div>}
            </>
          )}
        </section>

        <section className="card" aria-label="Key details">
          <div className="card-head"><span className="eyebrow">Key details</span></div>
          <div className="kv"><span>Date</span><span>{fmtFull(e.date)}</span></div>
          <div className="kv"><span>Doors open</span><span>{e.time}</span></div>
          <div className="kv"><span>Room</span><span>{e.room}</span></div>
          <div className="kv"><span>Type</span><span>{e.type}</span></div>
          <div className="kv"><span>DJ</span><span>{chips(djs)}</span></div>
          <div className="kv"><span>Vendors</span><span>{chips(vendors)}</span></div>
          <div className="kv"><span>Staff on shift</span>
            {editStaff ? (
              <input className="input" style={{ width: 90, padding: '8px 12px' }} type="number" min={0} autoFocus defaultValue={e.staffCount ?? ''}
                aria-label="Staff on shift besides Pawl"
                onBlur={(ev) => { const v = ev.target.value; patchEvent(e.id, { staffCount: v === '' ? null : Math.max(0, Number(v)) }); setEditStaff(false) }}
                onKeyDown={(ev) => ev.key === 'Enter' && (ev.target as HTMLInputElement).blur()} />
            ) : <button className="inline-edit" onClick={() => setEditStaff(true)}>{e.staffCount != null ? `Pawl + ${e.staffCount} staff` : 'Add'}</button>}
          </div>
          <span className="eyebrow" style={{ display: 'block', margin: '18px 0 10px' }}>Notes</span>
          <NotesBox white value={e.notes} onSave={(v) => patchEvent(e.id, { notes: v })} />
        </section>

        <div className="stack">
          {e.needsFloorPlan && (
            <section className="card" aria-label="Floor plan used">
              <div className="card-head"><span className="eyebrow">Floor plan used</span></div>
              <div className="fp-preview" aria-hidden style={{ display: 'grid', placeItems: 'center', color: '#8a8a8a', fontSize: 14 }}>No floor plan saved yet</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
                <b>{e.room}</b><Link className="link-arrow" to={`/events/${e.id}/floorplan`}>Open ↗</Link>
              </div>
            </section>)}
          <section className="card" aria-label="Rundown">
            <div className="card-head"><span className="eyebrow">Rundown</span></div>
            <div className="mini-rundown">{e.schedule.slice(0, 4).map((s) => <div key={s.id}><b>{s.time}</b>{s.title}</div>)}</div>
            <Link className="link-arrow" style={{ marginTop: 14 }} to={`/events/${e.id}/rundown`}>Open rundown ↗</Link>
          </section>
        </div>
      </div>
    </div>
  )
}
