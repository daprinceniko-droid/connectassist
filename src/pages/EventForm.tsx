import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useStore } from '../state/StoreProvider'
import { useToast } from '../state/ToastProvider'
import { Back, Modal } from '../components/ui'
import { ROOMS } from '../config'
import { useAuth } from '../state/AuthProvider'
import { EVENT_TYPES, type ContactCategory, type EventRec, type EventType, type FloorPlan, type Todo } from '../types'
import { uid } from '../lib/dates'
import { reuseSchedule } from '../lib/schedule'
import { byDateDesc } from '../lib/select'
import { clonePlan } from '../lib/plan'

/** The checks Pawl can switch on for an event. They are what shows up under "To Do" on the home page. */
const CHECK_PRESETS = ['Make posters', 'Confirm DJ', 'Confirm caterer', 'Confirm instructor']
/** Adding a contact of this category suggests the matching check (so a DJ, a caterer and an instructor can all be on one event). */
const CHECK_FOR_CATEGORY: Partial<Record<ContactCategory, string>> = { DJ: 'Confirm DJ', Food: 'Confirm caterer', Instructor: 'Confirm instructor' }

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
  const { user } = useAuth()
  const editing = id ? events.find((e) => e.id === id) : undefined

  const [name, setName] = useState(editing?.name ?? '')
  const [date, setDate] = useState(editing?.date ?? '')
  const [time, setTime] = useState(editing?.time ?? '')
  const [endDate, setEndDate] = useState(editing?.endDate ?? '')
  const [endTime, setEndTime] = useState(editing?.endTime ?? '')
  const [room, setRoom] = useState(editing?.room ?? ROOMS[2])
  const [type, setType] = useState<EventType>(editing?.type ?? 'Events')
  const [guests, setGuests] = useState(editing?.expectedGuests?.toString() ?? '')
  const [needsFP, setNeedsFP] = useState(editing?.needsFloorPlan ?? true)
  const [todos, setTodos] = useState<Todo[]>(editing?.todos ?? [])
  const [custom, setCustom] = useState('')
  const [bookedBy, setBookedBy] = useState(editing?.bookedBy ?? user?.name ?? 'Pawl')
  const [usedFrom, setUsedFrom] = useState<string | null>(null)
  const [contactIds, setContactIds] = useState<string[]>(editing?.contactIds ?? [])
  const [cover, setCover] = useState<string | null>(editing?.coverUrl ?? null)
  const [notes, setNotes] = useState(editing?.notes ?? '')
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
    setType(s.type); setRoom(s.room); setGuests(s.expectedGuests?.toString() ?? ''); setNeedsFP(s.needsFloorPlan)
    setContactIds(s.contactIds); setFrom(srcId); setUsedFrom(srcId); setSrcPlan(s.floorPlan); toast(`Started from ${s.name}`)
  }
  useEffect(() => { const f = sp.get('from'); if (f && !editing) applyFrom(f) /* eslint-disable-next-line */ }, [])

  if (id && !editing) return <div className="page"><Back to="/gallery" label="Gallery" /><p className="subtitle" style={{ marginTop: 24 }}>That event no longer exists.</p></div>

  const selected = contacts.filter((c) => contactIds.includes(c.id))
  const matches = contacts.filter((c) => !contactIds.includes(c.id) && (!q || `${c.name} ${c.category} ${c.speciality}`.toLowerCase().includes(q.toLowerCase())))
  const hasCheck = (text: string) => todos.some((t) => t.text === text)
  const toggleCheck = (text: string) => setTodos(hasCheck(text) ? todos.filter((t) => t.text !== text) : [...todos, { id: uid(), text, done: false }])
  const addCustom = () => { const t = custom.trim(); if (t && !hasCheck(t)) setTodos([...todos, { id: uid(), text: t, done: false }]); setCustom('') }
  const addContact = (c: (typeof contacts)[number]) => {
    setContactIds([...contactIds, c.id]); setQ(''); setOpen(false)
    const check = CHECK_FOR_CATEGORY[c.category]
    if (check && !hasCheck(check)) setTodos((l) => [...l, { id: uid(), text: check, done: false }])
  }
  const endDateValue = endDate || date

  const submit = async (ev: FormEvent) => {
    ev.preventDefault()
    const er: Record<string, string> = {}
    if (!name.trim()) er.name = 'Give the event a name.'
    if (!date) er.date = 'Pick a date.'
    if (!time) er.time = 'Add the start time.'
    if (date && endDateValue < date) er.endDate = 'The end date can’t be before the start date.'
    else if (date && time && endTime && `${endDateValue} ${endTime}` <= `${date} ${time}`) er.endTime = 'The end has to be after the start.'
    if (guests && (!/^\d+$/.test(guests))) er.guests = 'Use a whole number.'
    setErrs(er)
    if (Object.keys(er).length) return
    const base = {
      name: name.trim(), date, time, endDate: endDateValue > date ? endDateValue : null, endTime: endTime || null, room, type,
      expectedGuests: guests ? Number(guests) : null, needsFloorPlan: needsFP, contactIds, coverUrl: cover, notes, bookedBy: bookedBy.trim(), todos,
    }
    if (editing) {
      await saveEvent({ ...editing, ...base })
      toast('Event updated'); nav(`/events/${editing.id}`)
    } else {
      const src = usedFrom ? events.find((x) => x.id === usedFrom) : undefined
      const rec: EventRec = {
        id: uid(), ...base, actualGuests: null, rating: null, reflection: '', floorPlan: srcPlan && needsFP && srcPlan.room === room ? clonePlan(srcPlan) : null, staffCount: null,
        // No auto-fill: only a reused event brings its timeline and food/beverage text along
        schedule: src ? reuseSchedule(src.schedule, src.time, time) : [], foodBeverage: src?.foodBeverage ?? '',
        shareToken: null, isSample: false, createdAt: new Date().toISOString(),
      }
      await saveEvent(rec)
      toast(src ? `Event created. Timeline copied from ${src.name}` : 'Event created'); nav(`/events/${rec.id}/rundown`)
    }
  }

  return (
    <div className="page">
      <Back to={editing ? `/events/${editing.id}` : '/'} label={editing ? 'Event' : 'Dashboard'} />
      <h1 className="title">{editing ? 'Edit event' : 'New event'}</h1>
      <p className="subtitle" style={{ marginBottom: 36 }}>
        {editing ? 'Change the basics of this event.' : 'The basics for this event. You build the timeline yourself in the rundown, or start from a past event to reuse its timeline.'}
      </p>
      <form className="form-grid" onSubmit={submit} noValidate>
        <div className="card form-card">
          <div className="field"><label htmlFor="n">Event name</label>
            <input id="n" className="input" placeholder="e.g. Founders Coworking Night" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errs.name} />
            {errs.name && <p className="error-text">{errs.name}</p>}</div>
          <div className="grid-2">
            <div className="field"><label htmlFor="d">Start date</label>
              <input id="d" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} aria-invalid={!!errs.date} />
              {errs.date && <p className="error-text">{errs.date}</p>}</div>
            <div className="field"><label htmlFor="t">Start time</label>
              <input id="t" type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} aria-invalid={!!errs.time} />
              {errs.time && <p className="error-text">{errs.time}</p>}</div>
          </div>
          <div className="grid-2">
            <div className="field"><label htmlFor="ed">End date</label>
              <input id="ed" type="date" className="input" value={endDateValue} min={date || undefined} onChange={(e) => setEndDate(e.target.value)} aria-invalid={!!errs.endDate} />
              {errs.endDate && <p className="error-text">{errs.endDate}</p>}</div>
            <div className="field"><label htmlFor="et">End time</label>
              <input id="et" type="time" className="input" value={endTime} onChange={(e) => setEndTime(e.target.value)} aria-invalid={!!errs.endTime} />
              {errs.endTime && <p className="error-text">{errs.endTime}</p>}</div>
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
              <select id="fp" className="select" value={needsFP ? 'yes' : 'no'} onChange={(e) => setNeedsFP(e.target.value === 'yes')}>
                <option value="yes">Needed</option><option value="no">Not needed</option></select></div>
          </div>
          <div className="field picker"><label htmlFor="v">DJ / vendors</label>
            <input id="v" className="input" autoComplete="off" placeholder="Search the vendor directory…" value={q} onChange={(e) => { setQ(e.target.value); setOpen(true) }}
              onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} />
            {open && (
              <div className="picker-list">
                {matches.slice(0, 8).map((c) => (
                  <button type="button" key={c.id} onMouseDown={(e) => e.preventDefault()} onClick={() => addContact(c)}>
                    <span>{c.name}</span><small>{c.category}</small></button>))}
                {matches.length === 0 && <p className="empty-note" style={{ padding: 12 }}>No match. <Link to="/contacts" style={{ textDecoration: 'underline' }}>Add them in Contacts</Link>.</p>}
              </div>)}
            {selected.length > 0 && (
              <div className="chip-row" style={{ marginTop: 6 }}>
                {selected.map((c) => <span className="tag" key={c.id}>{c.name}<button type="button" aria-label={`Remove ${c.name}`} onClick={() => setContactIds(contactIds.filter((x) => x !== c.id))}>×</button></span>)}
              </div>)}
          </div>
          <div className="field"><label htmlFor="bb">Booked by</label>
            <input id="bb" className="input" value={bookedBy} onChange={(e) => setBookedBy(e.target.value)} autoComplete="off" /></div>
          <div className="field"><span className="label">Checks for the home page “To Do”</span>
            <p className="hint">Only what you switch on here is shown under “Next up”. Add a DJ, a caterer and an instructor if the event has all three.</p>
            <div className="chip-row" role="group" aria-label="Checks">
              {CHECK_PRESETS.map((c) => <button type="button" key={c} className={`btn sm ${hasCheck(c) ? 'primary' : 'white'}`} aria-pressed={hasCheck(c)} onClick={() => toggleCheck(c)}>{hasCheck(c) ? '✓ ' : '+ '}{c}</button>)}
              {todos.filter((t) => !CHECK_PRESETS.includes(t.text)).map((t) => <span className="tag" key={t.id}>{t.text}<button type="button" aria-label={`Remove ${t.text}`} onClick={() => setTodos(todos.filter((x) => x.id !== t.id))}>×</button></span>)}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <input className="input" aria-label="Add your own check" placeholder="Your own check, e.g. Order flowers" value={custom} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom() } }} />
              <button type="button" className="btn" disabled={!custom.trim()} onClick={addCustom}>Add</button>
            </div>
          </div>
          <div className="form-foot">
            {!editing ? <div className="auto-note"><span className="tick">✓</span>{usedFrom ? 'The timeline will be copied from the past event' : 'You build the timeline in the rundown next'}</div>
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
