import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../state/StoreProvider'
import { useToast } from '../state/ToastProvider'
import { Back, Modal } from '../components/ui'
import PlanSvg from '../components/PlanSvg'
import { floorPlanName, floorPlansOf, statLabel } from '../lib/plan'
import { OWNERS } from '../config'
import { uid } from '../lib/dates'
import { nextUp, peopleOf, whenShort } from '../lib/select'
import { shiftTime, sortSchedule, STANDARD_ELEMENTS } from '../lib/schedule'
import { downloadRundownPdf } from '../lib/pdf'
import { toShared } from '../lib/share'
import type { EventRec, ScheduleItem } from '../types'

function ItemModal({ item, start, defaultTime, onSave, onDelete, onClose }: { item: ScheduleItem | null; start: string; defaultTime: string; onSave: (i: ScheduleItem) => void; onDelete?: () => void; onClose: () => void }) {
  const [time, setTime] = useState(item?.time ?? defaultTime)
  const [title, setTitle] = useState(item?.title ?? '')
  const [owner, setOwner] = useState(item?.owner ?? 'Staff')
  return (
    <Modal title={item ? 'Edit item' : 'Add item'} lead={item ? undefined : 'Pick a standard element or write your own.'} onClose={onClose}>
      {!item && (
        <div className="chip-row" style={{ marginBottom: 18 }}>
          {STANDARD_ELEMENTS.map((s) => (
            <button key={s.label} type="button" className="chip" style={{ background: '#f3f3f3' }} onClick={() => { setTitle(s.title); setOwner(s.owner); setTime(shiftTime(start, s.lead)) }}>{s.label}</button>))}
        </div>)}
      <div className="grid-2">
        <div className="field"><label htmlFor="it">Time</label><input id="it" type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} /></div>
        <div className="field"><label htmlFor="io">Who</label>
          <input id="io" list="owners" className="input" value={owner} onChange={(e) => setOwner(e.target.value)} />
          <datalist id="owners">{OWNERS.map((o) => <option key={o} value={o} />)}</datalist></div>
      </div>
      <div className="field"><label htmlFor="ti">What happens</label><input id="ti" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Welcome speech" /></div>
      <div className="foot">
        {onDelete && <button className="btn outline left" onClick={onDelete}>Delete</button>}
        <button className="btn outline" onClick={onClose}>Cancel</button>
        <button className="btn primary" disabled={!title.trim() || !time} onClick={() => onSave({ id: item?.id ?? uid(), time, title: title.trim(), owner: owner.trim(), highlight: item?.highlight, auto: false })}>{item ? 'Save item' : 'Add item'}</button>
      </div>
    </Modal>
  )
}

const FLOOR_PLAN = (id: string) => `/events/${id}/floorplan?back=rundown`

export default function Rundown() {
  const { id } = useParams()
  const { events } = useStore()
  const e = id ? events.find((x) => x.id === id) : nextUp(events)
  if (!e) return (
    <div className="page"><Back to="/" label="Home" />
      <h1 className="title">Rundown - BEO</h1><p className="subtitle">{id ? 'That event no longer exists.' : 'No upcoming event yet. Create one to start its rundown.'}</p>
      {!id && <Link className="btn primary" style={{ marginTop: 20 }} to="/events/new">New event</Link>}</div>)
  return <RundownEditor key={e.id} e={e} />
}

function RundownEditor({ e }: { e: EventRec }) {
  const { contacts, patchEvent } = useStore()
  const toast = useToast()
  const floorPlans = floorPlansOf(e)
  const [modal, setModal] = useState<'add' | ScheduleItem | null>(null)

  // Everything on this page is a draft until "Save" is pressed.
  const [schedule, setSchedule] = useState<ScheduleItem[]>(e.schedule)
  const [fb, setFb] = useState(e.foodBeverage)
  // A new item starts at the time of the item you added last (or the last one on the timeline), so you can work down the list.
  const [lastTime, setLastTime] = useState<string | null>(() => (e.schedule.length ? e.schedule[e.schedule.length - 1].time : null))
  const [notes, setNotes] = useState(e.notes)
  const dirty = JSON.stringify(schedule) !== JSON.stringify(e.schedule) || fb !== e.foodBeverage || notes !== e.notes

  const live = useRef({ dirty, schedule, fb, notes, id: e.id, patchEvent, toast })
  live.current = { dirty, schedule, fb, notes, id: e.id, patchEvent, toast }
  const saveNow = (quiet = false) => {
    const c = live.current
    if (!c.dirty) { if (!quiet) c.toast('Rundown saved'); return }
    c.patchEvent(c.id, { schedule: sortSchedule(c.schedule), foodBeverage: c.fb, notes: c.notes })
    c.toast('Rundown saved')
  }
  // Safety net: leaving the page with unsaved changes saves them instead of losing them.
  useEffect(() => () => { if (live.current.dirty) saveNow(true) /* eslint-disable-next-line */ }, [])
  useEffect(() => {
    if (!dirty) return
    const warn = (ev: BeforeUnloadEvent) => { ev.preventDefault() }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const people = peopleOf(e, contacts)
  const djs = people.filter((p) => p.category === 'DJ').map((p) => p.name)
  const vendors = people.filter((p) => p.category !== 'DJ').map((p) => p.name)
  const saveItem = (i: ScheduleItem) => {
    if (!schedule.some((x) => x.id === i.id)) setLastTime(i.time)
    setSchedule(sortSchedule(schedule.some((x) => x.id === i.id) ? schedule.map((x) => (x.id === i.id ? i : x)) : [...schedule, i]))
    setModal(null)
  }
  const exportPdf = async () => {
    if (dirty) saveNow(true)
    await downloadRundownPdf(toShared({ ...e, schedule: sortSchedule(schedule), foodBeverage: fb, notes }, contacts))
    toast('PDF exported')
  }

  return (
    <div className="page">
      <div className="topbar"><Back to="/" label="Home" /><Link className="btn back" to={`/events/${e.id}`}>Event page</Link></div>
      <div className="head" style={{ marginTop: 6 }}>
        <div><h1 className="title" style={{ marginBottom: 8 }}>Rundown - BEO</h1><p className="subtitle">{e.name} · {whenShort(e)} · {e.room}</p></div>
        <div className="actions">
          <span className={`pill ${dirty ? 'dark' : ''}`} style={{ alignSelf: 'center' }} aria-live="polite">{dirty ? 'Unsaved changes' : '✓ All changes saved'}</span>
          <button className="btn primary" disabled={!dirty} onClick={() => saveNow()}>{dirty ? 'Save rundown' : '✓ Saved'}</button>
          <button className="btn" onClick={exportPdf}>Export PDF</button>
        </div>
      </div>

      <div className="rundown-grid">
        <section className="card" aria-label="Event timeline">
          <div className="card-head"><span className="eyebrow">Event timeline</span></div>
          <div className="rows">
            {schedule.map((s) => (
              <button key={s.id} className={`row ${s.highlight ? 'hl' : ''}`} onClick={() => setModal(s)} aria-label={`Edit ${s.title} at ${s.time}`}>
                <b>{s.time}</b><span>{s.title}</span><span className="o">{s.owner}</span></button>))}
            {schedule.length === 0 && <p className="empty-note" style={{ padding: '4px 4px 8px' }}>Nothing here yet. Add the first item, or start a new event from a past one to copy its timeline.</p>}
            <button className="dashed" onClick={() => setModal('add')}>+ Add item</button>
          </div>
        </section>

        <div className="stack">
          {(e.needsFloorPlan || floorPlans.length > 0) && (
            <section className="card" aria-label="Floor plan">
              <div className="card-head"><span className="eyebrow">Floor plans</span>{floorPlans.length ? <span className="pill">{floorPlans.length} room{floorPlans.length === 1 ? '' : 's'}</span> : <span className="pill dark">To add</span>}</div>
              {floorPlans.length ? floorPlans.map((plan, index) => (
                <div key={floorPlanName(plan, index)} style={{ marginBottom: 18 }}>
                  <Link to={FLOOR_PLAN(e.id)} className="fp-box" style={{ display: 'block' }}><PlanSvg plan={plan} /></Link>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, gap: 10 }}><b>{floorPlanName(plan, index)} · {plan.room} · {plan.basedOn ?? 'Custom layout'} · {statLabel(plan.items).split(' · ')[0]}</b><Link className="link-arrow" to={FLOOR_PLAN(e.id)}>Edit ↗</Link></div>
                </div>
              )) : (<>
                <Link to={FLOOR_PLAN(e.id)} className="drop"><span className="plus">+</span><b>Add floor plan</b><span>Pick a preset or build one</span></Link>
                <button className="btn sm" style={{ marginTop: 14 }} onClick={() => patchEvent(e.id, { needsFloorPlan: false })}>This event doesn’t need one</button>
              </>)}
            </section>)}
          <section className="card" aria-label="Key details">
            <div className="card-head"><span className="eyebrow">Key details</span><span className="pill">✓ Auto-filled</span></div>
            <div className="kv"><span>Guests expected</span><span>{e.expectedGuests ?? 'To be confirmed'}</span></div>
            <div className="kv"><span>DJ</span><span>{djs.join(', ') || 'To be confirmed'}</span></div>
            <div className="kv"><span>Vendors</span><span>{vendors.join(', ') || 'None'}</span></div>
            <div className="kv"><span>Room</span><span>{e.room}</span></div>
          </section>
        </div>

        <div className="stack">
          <section className="card" aria-label="Event Food, Beverage & Extras">
            <div className="card-head"><span className="eyebrow">Event Food, Beverage &amp; Extras</span></div>
            <textarea className="notes-area" rows={6} aria-label="Event Food, Beverage & Extras" placeholder="e.g. Finger food at 18:30, two drink tickets per guest, extra: photo wall…" value={fb} onChange={(ev) => setFb(ev.target.value)} />
          </section>
          <section className="card" aria-label="Event notes">
            <div className="card-head"><span className="eyebrow">Event notes</span></div>
            <textarea className="notes-area" rows={6} aria-label="Event notes" placeholder="Anything worth remembering for next time…" value={notes} onChange={(ev) => setNotes(ev.target.value)} />
          </section>
        </div>
      </div>

      {modal === 'add' && <ItemModal item={null} start={e.time} defaultTime={lastTime ?? e.time} onSave={saveItem} onClose={() => setModal(null)} />}
      {modal && typeof modal === 'object' && (
        <ItemModal item={modal} start={e.time} defaultTime={e.time} onSave={saveItem} onClose={() => setModal(null)}
          onDelete={() => { setSchedule(schedule.filter((x) => x.id !== (modal as ScheduleItem).id)); setModal(null) }} />)}
    </div>
  )
}
