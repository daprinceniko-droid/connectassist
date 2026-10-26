import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useStore } from '../state/StoreProvider'
import { useToast } from '../state/ToastProvider'
import { Back, Modal } from '../components/ui'
import { ROOMS } from '../config'
import { EVENT_TYPES, type EventRec, type EventType } from '../types'
import { todayISO, uid } from '../lib/dates'
import { defaultTodos, generateSchedule } from '../lib/schedule'
import { byDateDesc } from '../lib/select'
import { clonePlan } from '../lib/plan'
import type { FloorPlan } from '../types'

async function resizeImage(file: File, max = 900): Promise<string> {
  const url = URL.createObjectURL(file)
  const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url })
  const k = Math.min(1, max / Math.max(img.width, img.height))
  const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k)
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
  URL.revokeObjectURL(url)
  return c.toDataURL('image/jpeg', 0.8)
}

export default function EventForm() {
  const { id } = useParams()
  const [sp] = useSearchParams()
  const { events, contacts, saveEvent, deleteEvent } = useStore()
  const toast = useToast()
  const nav = useNavigate()
  const editing = id ? events.find((e) => e.id === id) : undefined

  const [name, setName] = useState(editing?.name ?? '')
  const [date, setDate] = useState(editing?.date ?? '')
  const [time, setTime] = useState(editing?.time ?? '')
  const [room, setRoom] = useState(editing?.room ?? ROOMS[2])
  const [type, setType] = useState<EventType>(editing?.type ?? 'Party')
  const [guests, setGuests] = useState(editing?.expectedGuests?.toString() ?? '')
  const [needsFP, setNeedsFP] = useState(editing?.needsFloorPlan ?? true)
  const [fpTouched, setFpTouched] = useState(Boolean(editing))
  const [contactIds, setContactIds] = useState<string[]>(editing?.contactIds ?? [])
  const [cover, setCover] = useState<string | null>(editing?.coverUrl ?? null)
  const [notes, setNotes] = useState(editing?.notes ?? '')
  const [rebuild, setRebuild] = useState(false)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState('')
  const [srcPlan, setSrcPlan] = useState<FloorPlan | null>(null)
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [confirmDel, setConfirmDel] = useState(false)
  const file = useRef<HTMLInputElement>(null)

  const past = useMemo(() => [...events].sort(byDateDesc), [events])
  const applyFrom = (srcId: string) => {
    const s = events.find((e) => e.id === srcId); if (!s) return
    setType(s.type); setRoom(s.room); setGuests(s.expectedGuests?.toString() ?? ''); setNeedsFP(s.needsFloorPlan); setFpTouched(true)
    setContactIds(s.contactIds); setFrom(srcId); setSrcPlan(s.floorPlan); toast(`Started from ${s.name}`)
  }
  useEffect(() => { const f = sp.get('from'); if (f && !editing) applyFrom(f) /* eslint-disable-next-line */ }, [])
  useEffect(() => { if (!fpTouched) setNeedsFP(type !== 'Active') }, [type, fpTouched])

  if (id && !editing) return <div className="page"><Back to="/gallery" label="Gallery" /><p className="subtitle" style={{ marginTop: 24 }}>That event no longer exists.</p></div>

  const selected = contacts.filter((c) => contactIds.includes(c.id))
  const matches = contacts.filter((c) => !contactIds.includes(c.id) && (!q || `${c.name} ${c.category} ${c.speciality}`.toLowerCase().includes(q.toLowerCase())))
  const hasDJ = selected.some((c) => c.category === 'DJ')

  const submit = async (ev: FormEvent) => {
    ev.preventDefault()
    const er: Record<string, string> = {}
    if (!name.trim()) er.name = 'Give the event a name.'
    if (!date) er.date = 'Pick a date.'
    if (!time) er.time = 'Add the time doors open.'
    if (guests && (!/^\d+$/.test(guests))) er.guests = 'Use a whole number.'
    setErrs(er)
    if (Object.keys(er).length) return
    const base = { name: name.trim(), date, time, room, type, expectedGuests: guests ? Number(guests) : null, needsFloorPlan: needsFP, contactIds, coverUrl: cover, notes }
    if (editing) {
      const schedule = rebuild ? generateSchedule({ type, time, hasDJ, needsFloorPlan: needsFP }) : editing.schedule
      await saveEvent({ ...editing, ...base, schedule })
      toast(rebuild ? 'Event updated. Your rundown was rebuilt' : 'Event updated'); nav(`/events/${editing.id}`)
    } else {
      const rec: EventRec = {
        id: uid(), ...base, actualGuests: null, rating: null, reflection: '', floorPlan: srcPlan && needsFP && srcPlan.room === room ? clonePlan(srcPlan) : null, staffCount: null,
        schedule: generateSchedule({ type, time, hasDJ, needsFloorPlan: needsFP }),
        todos: defaultTodos({ type, needsFloorPlan: needsFP, hasDJ }), shareToken: null, isSample: false, createdAt: new Date().toISOString(),
      }
      await saveEvent(rec)
      toast('Event created. Your rundown was filled in automatically'); nav(`/events/${rec.id}/rundown`)
    }
  }

  return (
    <div className="page">
      <Back to={editing ? `/events/${editing.id}` : '/'} label={editing ? 'Event' : 'Dashboard'} />
      <h1 className="title">{editing ? 'Edit event' : 'New event'}</h1>
      <p className="subtitle" style={{ marginBottom: 36 }}>
        {editing ? 'Change the basics. Your rundown stays as you left it unless you rebuild it.' : 'The basics for this event. Your rundown fills in automatically.'}
      </p>
      <form className="form-grid" onSubmit={submit} noValidate>
        <div className="card form-card">
          <div className="field"><label htmlFor="n">Event name</label>
            <input id="n" className="input" placeholder="e.g. Founders Coworking Night" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errs.name} />
            {errs.name && <p className="error-text">{errs.name}</p>}</div>
          <div className="grid-2">
            <div className="field"><label htmlFor="d">Date</label>
              <input id="d" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} min={editing ? undefined : undefined} aria-invalid={!!errs.date} />
              {errs.date && <p className="error-text">{errs.date}</p>}</div>
            <div className="field"><label htmlFor="t">Time (doors open)</label>
              <input id="t" type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} aria-invalid={!!errs.time} />
              {errs.time && <p className="error-text">{errs.time}</p>}</div>
          </div>
          <div className="grid-2">
            <div className="field"><label htmlFor="r">Room / layout</label>
              <select id="r" className="select" value={room} onChange={(e) => setRoom(e.target.value)}>
                {[...new Set([...ROOMS, room])].map((r) => <option key={r}>{r}</option>)}</select></div>
            <div className="field"><label htmlFor="ty">Type</label>
              <select id="ty" className="select" value={type} onChange={(e) => setType(e.target.value as EventType)}>
                {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
          </div>
          <div className="grid-2">
            <div className="field"><label htmlFor="g">Expected guests</label>
              <input id="g" inputMode="numeric" className="input" placeholder="e.g. 40" value={guests} onChange={(e) => setGuests(e.target.value)} aria-invalid={!!errs.guests} />
              {errs.guests && <p className="error-text">{errs.guests}</p>}</div>
            <div className="field"><label htmlFor="fp">Floor plan</label>
              <select id="fp" className="select" value={needsFP ? 'yes' : 'no'} onChange={(e) => { setNeedsFP(e.target.value === 'yes'); setFpTouched(true) }}>
                <option value="yes">Needed</option><option value="no">Not needed</option></select></div>
          </div>
          <div className="field picker"><label htmlFor="v">DJ / vendors</label>
            <input id="v" className="input" autoComplete="off" placeholder="Search the vendor directory…" value={q} onChange={(e) => { setQ(e.target.value); setOpen(true) }}
              onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} />
            {open && (
              <div className="picker-list">
                {matches.slice(0, 8).map((c) => (
                  <button type="button" key={c.id} onMouseDown={(e) => e.preventDefault()} onClick={() => { setContactIds([...contactIds, c.id]); setQ(''); setOpen(false) }}>
                    <span>{c.name}</span><small>{c.category}</small></button>))}
                {matches.length === 0 && <p className="empty-note" style={{ padding: 12 }}>No match. <Link to="/contacts" style={{ textDecoration: 'underline' }}>Add them in Contacts</Link>.</p>}
              </div>)}
            {selected.length > 0 && (
              <div className="chip-row" style={{ marginTop: 6 }}>
                {selected.map((c) => <span className="tag" key={c.id}>{c.name}<button type="button" aria-label={`Remove ${c.name}`} onClick={() => setContactIds(contactIds.filter((x) => x !== c.id))}>×</button></span>)}
              </div>)}
          </div>
          {editing && (
            <label className="auto-note" style={{ cursor: 'pointer' }}>
              <input type="checkbox" checked={rebuild} onChange={(e) => setRebuild(e.target.checked)} style={{ width: 22, height: 22, accentColor: '#0a0a0a' }} />
              Rebuild the rundown from these details (replaces your edits)
            </label>)}
          <div className="form-foot">
            {!editing ? <div className="auto-note"><span className="tick">✓</span>Your rundown is created automatically from these details</div>
              : <button type="button" className="btn outline" onClick={() => setConfirmDel(true)}>Delete event</button>}
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" className="btn outline" onClick={() => nav(-1)}>Cancel</button>
              <button className="btn primary">{editing ? 'Save changes' : 'Create event'}</button>
            </div>
          </div>
        </div>

        <div className="stack">
          {!editing && (
            <div className="card dark" style={{ padding: 24 }}>
              <h3 style={{ margin: 0, fontSize: 22 }}>Start from a past event</h3>
              <p className="muted" style={{ margin: '4px 0 16px', color: '#a8a8a8', fontSize: 14 }}>Reuse its floor plan, room and vendors</p>
              <div style={{ display: 'flex', gap: 12 }}>
                <select className="select" aria-label="Past event" style={{ background: '#222', color: '#fff', backgroundImage: undefined }} value={from} onChange={(e) => setFrom(e.target.value)}>
                  <option value="">None — start blank</option>{past.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
                <button type="button" className="btn white" disabled={!from} onClick={() => applyFrom(from)}>Use this</button>
              </div>
            </div>)}
          <div className="card" style={{ padding: 24 }}>
            <span className="label">Cover picture</span>
            <input ref={file} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) { setCover(await resizeImage(f)); toast('Cover photo added') } }} />
            <button type="button" className="cover-drop" style={{ marginTop: 8, backgroundImage: cover ? `url(${cover})` : undefined }} onClick={() => file.current?.click()}>
              {!cover && <><span className="plus">+</span>Tap to add a photo</>}</button>
            {cover && <button type="button" className="btn sm" style={{ marginTop: 10 }} onClick={() => setCover(null)}>Remove photo</button>}
          </div>
          <div className="card" style={{ padding: 24 }}>
            <label className="label" htmlFor="nt">Notes</label>
            <textarea id="nt" className="textarea" style={{ marginTop: 8 }} placeholder="Anything worth remembering for next time…" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
      </form>
      {confirmDel && editing && (
        <Modal title="Delete this event?" lead={`“${editing.name}” and its rundown will be removed from the archive. This can’t be undone.`} onClose={() => setConfirmDel(false)}>
          <div className="foot"><button className="btn outline" onClick={() => setConfirmDel(false)}>Keep event</button>
            <button className="btn primary" onClick={async () => { await deleteEvent(editing.id); toast('Event deleted'); nav('/gallery') }}>Delete event</button></div>
        </Modal>)}
    </div>
  )
}
