import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../state/StoreProvider'
import { useAuth } from '../state/AuthProvider'
import { fmtCal, fmtShort, monthGrid, monthName, parseISO, todayISO, weekdayLetters } from '../lib/dates'
import { byDateAsc, nextUp } from '../lib/select'

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
    for (const e of events) m.set(e.date, [...(m.get(e.date) ?? []), e])
    return m
  }, [events])
  const dayEvents = [...(byDay.get(sel) ?? [])].sort(byDateAsc)
  const shift = (n: number) => setView((v) => { const d = new Date(v.y, v.m + n, 1); return { y: d.getFullYear(), m: d.getMonth() } })
  const search = (e: FormEvent) => { e.preventDefault(); if (q.trim()) nav(`/search?q=${encodeURIComponent(q.trim())}`) }
  const openTodos = next?.todos ?? []

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
        <section className="nextup" aria-label="Next up">
          {next ? (
            <>
              <span className="eyebrow">Next up</span>
              <h2>{next.name}</h2>
              <p className="date">{fmtShort(next.date)} · doors {next.time}</p>
              <hr />
              <span style={{ fontSize: 20 }}>To Do:</span>
              <ul className="todo">
                {openTodos.length === 0 && <li style={{ color: '#a8a8a8' }}>Nothing left to do.</li>}
                {openTodos.map((t) => (
                  <li key={t.id}>
                    <button aria-pressed={t.done} className={t.done ? 'done' : ''} onClick={() => patchEvent(next.id, { todos: next.todos.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)) })}>
                      <span className="box">{t.done ? '✓' : ''}</span>{t.text}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="shortcuts">
                {next.needsFloorPlan && <Link className="btn white sm" to={`/events/${next.id}/floorplan`}>Floor plan</Link>}
                <Link className="btn white sm" to={`/events/${next.id}/rundown`}>Rundown</Link>
                <Link className="btn white sm" to={`/events/${next.id}`}>Open event</Link>
              </div>
            </>
          ) : (
            <>
              <span className="eyebrow">Next up</span>
              <h2>Nothing planned yet</h2>
              <p className="date">Create your next event and its rundown fills in automatically.</p>
              <div className="shortcuts"><Link className="btn white sm" to="/events/new">New event</Link></div>
            </>
          )}
        </section>

        <div className="mid">
          <Link to="/events/new" className="tile span">New Event <span className="arrow" aria-hidden>↗</span></Link>
          <Link to="/gallery" className="tile span">Gallery <span className="arrow" aria-hidden>↗</span></Link>
          <Link to={next ? `/events/${next.id}/rundown` : '/gallery'} className="tile span">Rundown <span className="arrow" aria-hidden>↗</span></Link>
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
