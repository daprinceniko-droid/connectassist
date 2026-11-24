import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../state/StoreProvider'
import { useToast } from '../state/ToastProvider'
import { Back } from '../components/ui'
import NotesBox from '../components/NotesBox'
import PlanSvg from '../components/PlanSvg'
import { floorPlanName, floorPlansOf, statLabel } from '../lib/plan'
import { isUpcoming, needsUpdate, pct, peopleOf, whenFull, whenShort } from '../lib/select'
import { EXTEND_BY, cloneOccurrence, nextDates, repeatEvery } from '../lib/recurrence'
import { fmtFull, todayISO } from '../lib/dates'

export default function EventPage() {
  const { id } = useParams()
  const { events, contacts, patchEvent, saveEvents } = useStore()
  const toast = useToast()
  const [editStaff, setEditStaff] = useState(false)
  const e = events.find((x) => x.id === id)
  if (!e) return <div className="page"><div className="topbar"><Back to="/" label="Home" /><Back to="/gallery" label="Gallery" /></div><p className="subtitle" style={{ marginTop: 24 }}>That event no longer exists.</p></div>

  const series = e.seriesId && e.repeat ? events.filter((x) => x.seriesId === e.seriesId).sort((a, b) => a.date.localeCompare(b.date)) : []
  const extend = async () => {
    if (!e.repeat || !e.seriesId || series.length === 0) return
    const last = series[series.length - 1]
    const dates = nextDates(series[0].date, e.repeat, last.date, EXTEND_BY)
    await saveEvents(dates.map((d) => cloneOccurrence(last, d, e.seriesId!, e.repeat!)))
    toast(`${dates.length} more events added, until ${fmtFull(dates[dates.length - 1])}`)
  }
  const people = peopleOf(e, contacts)
  const floorPlans = floorPlansOf(e)
  const rooms = floorPlans.length ? floorPlans.map(floorPlanName) : [e.room].filter(Boolean)
  const djs = people.filter((p) => p.category === 'DJ')
  const vendors = people.filter((p) => p.category !== 'DJ')
  const logged = e.actualGuests != null
  const share = logged ? pct(e.actualGuests!, e.expectedGuests) : null
  const upcoming = isUpcoming(e)
  const chips = (list: typeof people) => list.length ? list.map((p) => <Link key={p.id} className="pill link" to={`/contacts?c=${p.id}`}>{p.name}</Link>) : <span style={{ fontWeight: 400, color: 'var(--muted)' }}>None</span>

  return (
    <div className="page">
      <div className="topbar"><Back to="/" label="Home" /><Back to="/gallery" label="Gallery" /></div>
      <div className="head" style={{ marginTop: 6 }}>
        <div>
          <h1 className="title" style={{ marginBottom: 8 }}>{e.name}</h1>
          <p className="subtitle">{whenShort(e)} · {rooms.join(', ')} · {e.type}</p>
        </div>
        <div className="actions">
          {(e.needsFloorPlan || floorPlans.length > 0) && <Link className="btn" to={`/events/${e.id}/floorplan?back=event`}>Floor plans</Link>}
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
          <span className="eyebrow" style={{ color: 'var(--main-foreground)', opacity: .78 }}>Post-event update</span>
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
          <div className="kv"><span>Date &amp; time</span><span>{whenFull(e)}</span></div>
          <div className="kv"><span>Booked by</span><span>{e.bookedBy || '—'}</span></div>
          {series.length > 0 && e.repeat && (
            <div className="kv"><span>Repeats</span>
              <span style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <span>{repeatEvery(e.repeat)} · {series.filter((x) => x.date >= todayISO()).length} upcoming, until {fmtFull(series[series.length - 1].date)}</span>
                <button className="btn sm" onClick={extend}>Add {EXTEND_BY} more</button>
              </span></div>)}
          <div className="kv"><span>Rooms</span><span>{rooms.join(', ')}</span></div>
          <div className="kv"><span>Type</span><span>{e.type}</span></div>
          <div className="kv"><span>DJ</span><span>{chips(djs)}</span></div>
          <div className="kv"><span>Vendors</span><span>{chips(vendors)}</span></div>
          <div className="kv"><span>Staff on shift</span>
            {editStaff ? (
              <input className="input" style={{ width: 90, padding: '8px 12px' }} type="number" min={0} autoFocus defaultValue={e.staffCount ?? ''}
                aria-label="Staff on shift"
                onBlur={(ev) => { const v = ev.target.value; patchEvent(e.id, { staffCount: v === '' ? null : Math.max(0, Number(v)) }); setEditStaff(false) }}
                onKeyDown={(ev) => ev.key === 'Enter' && (ev.target as HTMLInputElement).blur()} />
            ) : <button className="inline-edit" onClick={() => setEditStaff(true)}>{e.staffCount != null ? e.staffCount : 'Add'}</button>}
          </div>
          <span className="eyebrow" style={{ display: 'block', margin: '18px 0 10px' }}>Notes</span>
          <NotesBox white value={e.notes} onSave={(v) => patchEvent(e.id, { notes: v })} />
        </section>

        <div className="stack">
          {(e.needsFloorPlan || floorPlans.length > 0) && (
            <section className="card" aria-label="Floor plans">
              <div className="card-head"><span className="eyebrow">Floor plans</span><span className="pill">{floorPlans.length} room{floorPlans.length === 1 ? '' : 's'}</span></div>
              {floorPlans.length ? floorPlans.map((plan, index) => (
                <div key={floorPlanName(plan, index)} style={{ marginBottom: 18 }}>
                  <Link to={`/events/${e.id}/floorplan?back=event`} className="fp-box" style={{ display: 'block' }}><PlanSvg plan={plan} /></Link>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, gap: 10 }}>
                    <b>{floorPlanName(plan, index)} · {plan.room} · {plan.basedOn ?? 'Custom layout'} · {statLabel(plan.items).split(' · ')[0]}</b>
                    <Link className="link-arrow" to={`/events/${e.id}/floorplan?back=event`}>Open ↗</Link>
                  </div>
                </div>
              )) : <div className="fp-preview" aria-hidden style={{ display: 'grid', placeItems: 'center', color: 'var(--muted)', fontSize: 14, aspectRatio: 2.2 }}>No floor plan saved yet</div>}
              <Link className="link-arrow" to={`/events/${e.id}/floorplan?back=event`}>{floorPlans.length ? 'Manage rooms' : 'Create floor plan'} ↗</Link>
            </section>)}
          {e.todos.length > 0 && (
            <section className="card dark" aria-label="To do">
              <div className="card-head"><span className="eyebrow">To Do</span><span className="pill">{e.todos.filter((todo) => todo.done).length}/{e.todos.length} done</span></div>
              <ul className="todo">
                {e.todos.map((todo) => (
                  <li key={todo.id}>
                    <button aria-pressed={todo.done} className={todo.done ? 'done' : ''} onClick={() => patchEvent(e.id, { todos: e.todos.map((item) => item.id === todo.id ? { ...item, done: !item.done } : item) })}>
                      <span className="box">{todo.done ? '✓' : ''}</span>{todo.text}
                    </button>
                  </li>
                ))}
              </ul>
            </section>)}
          <section className="card" aria-label="Rundown - BEO">
            <div className="card-head"><span className="eyebrow">Rundown - BEO</span></div>
            <div className="mini-rundown">{e.schedule.length === 0 ? <span style={{ color: 'var(--muted)' }}>No timeline yet</span> : e.schedule.slice(0, 4).map((s) => <div key={s.id}><b>{s.time}</b>{s.title}</div>)}</div>
            <Link className="link-arrow" style={{ marginTop: 14 }} to={`/events/${e.id}/rundown`}>Open rundown ↗</Link>
          </section>
        </div>
      </div>
    </div>
  )
}
