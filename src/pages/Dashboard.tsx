import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../state/StoreProvider'
import { useAuth } from '../state/AuthProvider'
import { addDays, fmtCal, monthGrid, monthName, parseISO, todayISO, weekdayLetters } from '../lib/dates'
import { byDateAsc, lastDay, nextUp, whenShort } from '../lib/select'

export default function Dashboard() {
  const { events, patchEvent, hasSample, removeSample, loadSample } = useStore()
  const { user, demo, signOut } = useAuth()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const today = todayISO()
  const [sel, setSel] = useState(today)
  const [view, setView] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() } })
  const next = nextUp(events)
  const byDay = useMemo(() => {
    const m = new Map<string, typeof events>()
    for (const e of events) {
      const end = lastDay(e)
      for (let d = e.date, n = 0; d <= end && n < 31; d = addDays(d, 1), n++) m.set(d, [...(m.get(d) ?? []), e])
    }
    return m
  }, [events])
  const dayEvents = [...(byDay.get(sel) ?? [])].sort(byDateAsc)
  const shift = (n: number) => setView((v) => { const d = new Date(v.y, v.m + n, 1); return { y: d.getFullYear(), m: d.getMonth() } })
  const search = (e: FormEvent) => { e.preventDefault(); if (q.trim()) nav(`/search?q=${encodeURIComponent(q.trim())}`) }
  const todos = next?.todos ?? []
  const missingPlan = !!next && next.needsFloorPlan && !next.floorPlan && !next.floorPlans?.length
  const openNext = () => next && nav(`/events/${next.id}`)

  return (
    <div className="page">
      <div className="dash-top">
        <h1>Hi {user?.name ?? 'Pawl'}!</h1>
        <form onSubmit={search} role="search">
          <input className="input pill-input" aria-label="Search events, DJs, vendors" placeholder="Search events, DJs, vendors…" value={q} onChange={(e) => setQ(e.target.value)} />
        </form>
        <div className="who">{!demo && <button className="btn sm" onClick={signOut}>Sign out</button>}</div>
      </div>

      <div className="dash-grid">
        <section className={`nextup ${next ? 'clickable' : ''}`} aria-label="Next up"
          {...(next ? { role: 'link', tabIndex: 0, onClick: openNext, onKeyDown: (ev: React.KeyboardEvent) => { if (ev.target === ev.currentTarget && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); openNext() } } } : {})}>
          {next ? (
            <>
              <div className="nextup-top"><span className="eyebrow">Next up</span><span className="arrow sm" aria-hidden>↗</span></div>
              <h2>{next.name}</h2>
              <p className="date">{whenShort(next)}</p>
              <hr />
              <span style={{ fontSize: 20 }}>To Do:</span>
              <ul className="todo">
                {missingPlan && (
                  <li className="todo-fp">
                    <span>No floor plan yet</span>
                    <Link className="btn white sm" to={`/events/${next.id}/floorplan?back=home`} onClick={(ev) => ev.stopPropagation()}>Add floor plan</Link>
                  </li>
                )}
                {todos.length === 0 && !missingPlan && <li style={{ color: '#a8a8a8' }}>Nothing to do.</li>}
                {todos.map((t) => (
                  <li key={t.id}>
                    <button aria-pressed={t.done} className={t.done ? 'done' : ''} onClick={(ev) => { ev.stopPropagation(); patchEvent(next.id, { todos: next.todos.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)) }) }}>
                      <span className="box">{t.done ? '✓' : ''}</span>{t.text}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <span className="eyebrow">Next up</span>
              <h2>Nothing planned yet</h2>
              <p className="date">Create your next event to see it here.</p>
              <div className="shortcuts"><Link className="btn white sm" to="/events/new">New event</Link></div>
            </>
          )}
        </section>

        <div className="mid">
          <Link to="/events/new" className="tile span">New Event <span className="arrow" aria-hidden>↗</span></Link>
          <Link to="/gallery" className="tile span">Gallery <span className="arrow" aria-hidden>↗</span></Link>
          <Link to="/contacts" className="tile small">Contacts</Link>
          <div className="tile small soon" aria-disabled>Guest Stats <span className="pill grey" style={{ fontSize: 12 }}>Soon</span></div>
        </div>

        <section className="cal" aria-label="Calendar">
          <div className="cal-head">
            <h3>{monthName(view.m)}{view.y !== new Date().getFullYear() ? ` ${view.y}` : ''}</h3>
            <div className="ctl">
              <button aria-label="Previous month" onClick={() => shift(-1)}>‹</button>
              <button aria-label="Next month" onClick={() => shift(1)}>›</button>
            </div>
          </div>
          <div className="cal-grid" role="grid">
            {weekdayLetters().map((l, i) => <span className="wd" key={i}>{l}</span>)}
            {monthGrid(view.y, view.m).flat().map((c) => (
              <button key={c.iso} aria-label={fmtCal(c.iso)} aria-pressed={c.iso === sel}
                className={['cal-day', !c.inMonth && 'out', c.iso === today && 'today', c.iso === sel && 'sel', byDay.has(c.iso) && 'has'].filter(Boolean).join(' ')}
                onClick={() => { setSel(c.iso); if (!c.inMonth) { const d = parseISO(c.iso); setView({ y: d.getFullYear(), m: d.getMonth() }) } }}>
                {parseISO(c.iso).getDate()}
              </button>
            ))}
          </div>
          <div className="cal-foot">
            <span>{fmtCal(sel)}</span>
            {dayEvents.length > 0 && <span className="pill dark">{dayEvents.length} event{dayEvents.length > 1 ? 's' : ''}</span>}
          </div>
          {dayEvents.length === 0 && <p className="empty-note">No events on this day.</p>}
          {dayEvents.slice(0, 3).map((e) => (
            <Link key={e.id} to={`/events/${e.id}`} className="cal-ev"><span className="dot" />{e.name}<small>{e.time}</small></Link>
          ))}
        </section>
      </div>

      {(demo || hasSample || events.length === 0) && (
        <div className="demo-banner">
          {demo && <span><b>Demo mode.</b> No database connected, so data stays in this browser only.</span>}
          {hasSample ? <button className="btn sm" onClick={removeSample}>Remove sample data</button>
            : events.length === 0 && <button className="btn sm primary" onClick={loadSample}>Load sample events</button>}
        </div>
      )}
    </div>
  )
}
