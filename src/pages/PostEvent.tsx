import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../state/StoreProvider'
import { useToast } from '../state/ToastProvider'
import { Back } from '../components/ui'
import { fmtShort, todayISO } from '../lib/dates'
import { pct } from '../lib/select'
import type { Rating } from '../types'

export default function PostEvent() {
  const { id } = useParams()
  const { events, patchEvent } = useStore()
  const toast = useToast()
  const nav = useNavigate()
  const e = events.find((x) => x.id === id)
  const [n, setN] = useState<number>(e?.actualGuests ?? e?.expectedGuests ?? 0)
  const [rating, setRating] = useState<Rating | null>(e?.rating ?? null)
  const [refl, setRefl] = useState(e?.reflection ?? '')
  if (!e) return <div className="page"><Back to="/gallery" label="Gallery" /><p className="subtitle">That event no longer exists.</p></div>

  const done = events.filter((x) => x.id !== e.id && x.actualGuests != null && x.date.startsWith(todayISO().slice(0, 4)))
  const withThis = [...done, { ...e, actualGuests: n }]
  const past = events.filter((x) => x.date < todayISO() && x.date.startsWith(todayISO().slice(0, 4)))
  const total = withThis.reduce((a, x) => a + (x.actualGuests ?? 0), 0)
  const rates = withThis.map((x) => pct(x.actualGuests ?? 0, x.expectedGuests)).filter((x): x is number => x != null)
  const avg = rates.length ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : null

  const save = async () => {
    await patchEvent(e.id, { actualGuests: Math.max(0, Math.round(n)), rating, reflection: refl.trim() })
    toast('Update saved to the archive'); nav(`/events/${e.id}`)
  }
  return (
    <div className="page">
      <Back to={`/events/${e.id}`} label="Event" />
      <h1 className="title">Post-event update</h1>
      <p className="subtitle" style={{ marginBottom: 36 }}>{e.name} · {fmtShort(e.date)}. Takes about a minute.</p>
      <div className="form-grid">
        <div className="card form-card">
          <div className="field"><label htmlFor="a">Actual guests</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="stepper">
                <input id="a" type="number" min={0} value={Number.isNaN(n) ? '' : n} onChange={(ev) => setN(ev.target.value === '' ? NaN : Number(ev.target.value))} />
                <button type="button" aria-label="One fewer" onClick={() => setN(Math.max(0, (n || 0) - 1))}>−</button>
                <button type="button" className="plus-b" aria-label="One more" onClick={() => setN((n || 0) + 1)}>+</button>
              </div>
              <span style={{ color: '#8a8a8a' }}>{e.expectedGuests ?? '—'} expected</span>
            </div></div>
          <div className="field"><span className="label">How did it go?</span>
            <div className="chip-row" role="group" aria-label="Rating">
              {(['Rough', 'Okay', 'Great'] as Rating[]).map((r) => (
                <button type="button" key={r} className={`btn ${rating === r ? 'primary' : 'white'}`} aria-pressed={rating === r} onClick={() => setRating(rating === r ? null : r)}>{r}</button>))}
            </div></div>
          <div className="field"><label htmlFor="rf">Reflection</label>
            <textarea id="rf" className="textarea" style={{ minHeight: 150 }} placeholder="What worked, what didn’t, what to do differently next time…" value={refl} onChange={(ev) => setRefl(ev.target.value)} /></div>
          <div className="form-foot">
            <div className="auto-note"><span className="tick">✓</span>Saved to the archive</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <Link className="btn outline" to={`/events/${e.id}`}>Cancel</Link>
              <button className="btn primary" disabled={Number.isNaN(n)} onClick={save}>Save update</button>
            </div>
          </div>
        </div>
        <div className="stack">
          <div className="card dark" style={{ minHeight: 190 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 22 }}>Why this matters</h3>
            <p style={{ color: '#bdbdbd', fontSize: 15, lineHeight: 1.5, margin: 0 }}>Real numbers feed the archive, so next time you plan with actual attendance instead of a guess.</p>
          </div>
          <div className="card">
            <span className="eyebrow">This year so far</span>
            <div className="stat-row" style={{ marginTop: 10 }}>Events logged<b>{withThis.length} of {Math.max(past.length, withThis.length)}</b></div>
            <div className="stat-row">Guests logged<b>{total}</b></div>
            <div className="stat-row">Average show-up<b>{avg != null ? `${avg}%` : '—'}</b></div>
          </div>
        </div>
      </div>
    </div>
  )
}
