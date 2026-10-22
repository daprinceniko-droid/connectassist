import { useSearchParams, Link } from 'react-router-dom'
import { useStore } from '../state/StoreProvider'
import { Back } from '../components/ui'
import { fmtShort, initials } from '../lib/dates'
import { byDateDesc, peopleOf } from '../lib/select'

export default function Search() {
  const [sp, setSp] = useSearchParams()
  const q = sp.get('q') ?? ''
  const { events, contacts } = useStore()
  const t = q.trim().toLowerCase()
  const cs = t ? contacts.filter((c) => `${c.name} ${c.speciality} ${c.category}`.toLowerCase().includes(t)) : []
  const es = t ? events.filter((e) => [e.name, e.type, e.room, e.notes, ...peopleOf(e, contacts).map((p) => p.name)].some((s) => s.toLowerCase().includes(t))).sort(byDateDesc) : []
  return (
    <div className="page">
      <Back to="/" label="Dashboard" />
      <h1 className="title">Search</h1>
      <input className="input pill-input" style={{ maxWidth: 560, margin: '8px 0 32px' }} aria-label="Search" autoFocus value={q} onChange={(e) => setSp({ q: e.target.value }, { replace: true })} placeholder="Search events, DJs, vendors…" />
      {!t && <p className="empty-note">Type a name, room or event type.</p>}
      {t && cs.length + es.length === 0 && <p className="empty-note">Nothing found for “{q}”. Try a different spelling or fewer letters.</p>}
      {cs.length > 0 && <><span className="eyebrow">Contacts</span>
        <div className="ccards" style={{ margin: '14px 0 36px' }}>{cs.map((c) => (
          <Link key={c.id} to={`/contacts?c=${c.id}`} className="ccard"><div className="who"><span className="avatar">{initials(c.name)}</span><div><b>{c.name}</b><small>{c.category}{c.speciality && ` · ${c.speciality}`}</small></div></div></Link>))}</div></>}
      {es.length > 0 && <><span className="eyebrow">Events</span>
        <div className="cards" style={{ marginTop: 14 }}>{es.map((e) => (
          <Link key={e.id} to={`/events/${e.id}`} className="ecard" style={{ aspectRatio: 'auto', minHeight: 150 }}><span className="pill" style={{ alignSelf: 'flex-start' }}>{e.type}</span>
            <div><h3>{e.name}</h3><span className="meta">{fmtShort(e.date)} · {e.room}</span></div></Link>))}</div></>}
    </div>
  )
}
