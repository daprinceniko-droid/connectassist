import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../state/StoreProvider'
import { Back } from '../components/ui'
import { EVENT_TYPES } from '../types'
import { fmtShort } from '../lib/dates'
import { byDateDesc, isUpcoming, needsUpdate, peopleOf } from '../lib/select'

export default function Gallery() {
  const { events, contacts, loadSample } = useStore()
  const thisYear = String(new Date().getFullYear())
  const years = useMemo(() => [...new Set([thisYear, ...events.map((e) => e.date.slice(0, 4))])].sort().reverse(), [events, thisYear])
  const [year, setYear] = useState(thisYear)
  const [type, setType] = useState<string>('All')
  const [q, setQ] = useState('')

  const inYear = events.filter((e) => e.date.startsWith(year))
  const term = q.trim().toLowerCase()
  const shown = inYear
    .filter((e) => type === 'All' || e.type === type)
    .filter((e) => !term || [e.name, e.type, e.room, ...peopleOf(e, contacts).map((p) => p.name)].some((s) => s.toLowerCase().includes(term)))
    .sort(byDateDesc)
  const count = (t: string) => inYear.filter((e) => t === 'All' || e.type === t).length

  return (
    <div className="page with-side">
      <aside className="side">
        <div><Back to="/" label="Dashboard" /></div>
        <span className="eyebrow">Type</span>
        {['All', ...EVENT_TYPES].map((t) => (
          <button key={t} className={`nav-row ${type === t ? 'on' : ''}`} aria-pressed={type === t} onClick={() => setType(t)}>
            <span>{t === 'All' ? 'All events' : t}</span><span className="n">{count(t)}</span>
          </button>
        ))}
        <span className="eyebrow">Year</span>
        <div className="year-row">{years.map((y) => <button key={y} className={y === year ? 'on' : ''} aria-pressed={y === year} onClick={() => setYear(y)}>{y}</button>)}</div>
      </aside>
      <main className="side-main">
        <div className="head" style={{ marginBottom: 0 }}>
          <div><h1 className="title" style={{ marginTop: 0 }}>Gallery</h1><p className="subtitle">Browse past events and reuse what worked.</p></div>
          <input className="input pill-input" style={{ maxWidth: 380 }} aria-label="Search events" placeholder="Search events…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="cards">
          <Link to="/events/new" className="ecard new"><span className="plus">+</span>New event</Link>
          {shown.map((e) => (
            <Link key={e.id} to={`/events/${e.id}`} className={`ecard ${e.coverUrl ? 'cover' : ''}`} style={e.coverUrl ? { backgroundImage: `url(${e.coverUrl})` } : undefined}>
              <div className="top">
                <span className="pill">{e.type}</span>
                {isUpcoming(e) ? <span className="pill dark">Upcoming</span> : needsUpdate(e) && <span className="pill dark">Needs update</span>}
              </div>
              <div>
                <h3>{e.name}</h3>
                <span className="meta">{fmtShort(e.date)} · {isUpcoming(e) ? 'Upcoming' : e.actualGuests != null ? `${e.actualGuests} guests` : e.expectedGuests ? `${e.expectedGuests} expected` : 'No guest count'}</span>
              </div>
            </Link>
          ))}
        </div>
        {shown.length === 0 && (
          <p className="empty-note" style={{ marginTop: 28 }}>
            {events.length === 0 ? <>No events yet. <button className="btn sm" onClick={loadSample}>Load sample events</button></> : 'No events match these filters.'}
          </p>
        )}
      </main>
    </div>
  )
}
