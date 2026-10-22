import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../state/StoreProvider'
import { useToast } from '../state/ToastProvider'
import { Back, Modal } from '../components/ui'
import NotesBox from '../components/NotesBox'
import { OWNERS } from '../config'
import { fmtShort, uid } from '../lib/dates'
import { nextUp, peopleOf } from '../lib/select'
import { shiftTime, sortSchedule, STANDARD_ELEMENTS } from '../lib/schedule'
import { downloadRundownPdf } from '../lib/pdf'
import { shareUrl, toShared } from '../lib/share'
import type { EventRec, ScheduleItem } from '../types'

function ItemModal({ item, doors, onSave, onDelete, onClose }: { item: ScheduleItem | null; doors: string; onSave: (i: ScheduleItem) => void; onDelete?: () => void; onClose: () => void }) {
  const [time, setTime] = useState(item?.time ?? doors)
  const [title, setTitle] = useState(item?.title ?? '')
  const [owner, setOwner] = useState(item?.owner ?? 'Staff')
  return (
    <Modal title={item ? 'Edit item' : 'Add item'} lead={item ? undefined : 'Pick a standard element or write your own.'} onClose={onClose}>
      {!item && (
        <div className="chip-row" style={{ marginBottom: 18 }}>
          {STANDARD_ELEMENTS.map((s) => (
            <button key={s.label} type="button" className="chip" style={{ background: '#f3f3f3' }} onClick={() => { setTitle(s.title); setOwner(s.owner); setTime(shiftTime(doors, s.lead)) }}>{s.label}</button>))}
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

function ShareModal({ e, onClose }: { e: EventRec; onClose: () => void }) {
  const { ensureShareToken, stopSharing, contacts } = useStore()
  const toast = useToast()
  const [url, setUrl] = useState<string | null>(e.shareToken ? shareUrl(e.shareToken) : null)
  const create = async () => setUrl(shareUrl(await ensureShareToken(e.id)))
  if (!url && !e.shareToken) void 0
  const copy = async () => { await navigator.clipboard.writeText(url!); toast('Link copied to clipboard') }
  return (
    <Modal title="Share rundown" lead="Anyone with the link can view this rundown. No account needed, and no contact details are shown." onClose={onClose}>
      {url ? (
        <>
          <div className="field"><label htmlFor="su">Link</label><input id="su" className="input" readOnly value={url} onFocus={(ev) => ev.target.select()} /></div>
          <div className="foot" style={{ justifyContent: 'flex-start' }}>
            <button className="btn primary" onClick={copy}>Copy link</button>
            <a className="btn" href={`mailto:?subject=${encodeURIComponent(`Rundown: ${e.name}`)}&body=${encodeURIComponent(`Here’s the rundown for ${e.name} (${fmtShort(e.date)}):\n${url}`)}`} onClick={() => toast('Email draft opened')}>Email link</a>
            <button className="btn" onClick={async () => { await downloadRundownPdf(toShared(e, contacts)); toast('PDF exported') }}>Download PDF</button>
            <button className="btn outline left" style={{ marginLeft: 'auto' }} onClick={async () => { await stopSharing(e.id); setUrl(null); toast('Sharing stopped. The old link no longer works') }}>Stop sharing</button>
          </div>
        </>
      ) : (
        <div className="foot"><button className="btn outline" onClick={onClose}>Cancel</button><button className="btn primary" onClick={create}>Create share link</button></div>
      )}
    </Modal>
  )
}

export default function Rundown() {
  const { id } = useParams()
  const { events, contacts, patchEvent } = useStore()
  const toast = useToast()
  const [modal, setModal] = useState<'add' | 'share' | ScheduleItem | null>(null)
  const e = id ? events.find((x) => x.id === id) : nextUp(events)
  if (!e) return (
    <div className="page"><Back to="/" label="Home" />
      <h1 className="title">Rundown</h1><p className="subtitle">{id ? 'That event no longer exists.' : 'No upcoming event yet. Create one and its rundown fills in automatically.'}</p>
      {!id && <Link className="btn primary" style={{ marginTop: 20 }} to="/events/new">New event</Link>}</div>)

  const people = peopleOf(e, contacts)
  const djs = people.filter((p) => p.category === 'DJ').map((p) => p.name)
  const vendors = people.filter((p) => p.category !== 'DJ').map((p) => p.name)
  const allAuto = e.schedule.every((s) => s.auto)
  const setSchedule = (s: ScheduleItem[]) => patchEvent(e.id, { schedule: sortSchedule(s) })
  const saveItem = (i: ScheduleItem) => { setSchedule(e.schedule.some((x) => x.id === i.id) ? e.schedule.map((x) => (x.id === i.id ? i : x)) : [...e.schedule, i]); toast(modal === 'add' ? 'Item added to the schedule' : 'Item updated'); setModal(null) }

  return (
    <div className="page">
      <div className="topbar"><Back to="/" label="Home" /><Link className="btn back" to="/gallery">Gallery</Link><Link className="btn back" to={`/events/${e.id}`}>Event page</Link></div>
      <div className="head" style={{ marginTop: 6 }}>
        <div><h1 className="title" style={{ marginBottom: 8 }}>Rundown</h1><p className="subtitle">{e.name} · {fmtShort(e.date)} · {e.room}</p></div>
        <div className="actions"><button className="btn" onClick={() => setModal('share')}>Share link</button>
          <button className="btn primary" onClick={async () => { await downloadRundownPdf(toShared(e, contacts)); toast('PDF exported') }}>Export PDF</button></div>
      </div>

      <div className="rundown-grid">
        <section className="card" aria-label="Schedule">
          <div className="card-head"><span className="eyebrow">Schedule</span><span className="pill">{allAuto ? '✓ Auto-filled' : 'Edited'}</span></div>
          <div className="rows">
            {e.schedule.map((s) => (
              <button key={s.id} className={`row ${s.highlight ? 'hl' : ''}`} onClick={() => setModal(s)} aria-label={`Edit ${s.title} at ${s.time}`}>
                <b>{s.time}</b><span>{s.title}</span><span className="o">{s.owner}</span></button>))}
            <button className="dashed" onClick={() => setModal('add')}>+ Add item</button>
          </div>
        </section>

        <div className="stack">
          {e.needsFloorPlan && (
            <section className="card" aria-label="Floor plan">
              <div className="card-head"><span className="eyebrow">Floor plan</span><span className="pill dark">To add</span></div>
              <Link to={`/events/${e.id}/floorplan`} className="drop"><span className="plus">+</span><b>Add floor plan</b><span>Pick a preset or build one</span></Link>
              <button className="btn sm" style={{ marginTop: 14 }} onClick={() => patchEvent(e.id, { needsFloorPlan: false })}>This event doesn’t need one</button>
            </section>)}
          <section className="card" aria-label="Key details">
            <div className="card-head"><span className="eyebrow">Key details</span><span className="pill">✓ Auto-filled</span></div>
            <div className="kv"><span>Guests expected</span><span>{e.expectedGuests ?? 'To be confirmed'}</span></div>
            <div className="kv"><span>DJ</span><span>{djs.join(', ') || 'To be confirmed'}</span></div>
            <div className="kv"><span>Vendors</span><span>{vendors.join(', ') || 'None'}</span></div>
            <div className="kv"><span>Room</span><span>{e.room}</span></div>
          </section>
        </div>

        <section className="card" aria-label="Notes">
          <div className="card-head"><span className="eyebrow">Notes</span></div>
          <NotesBox value={e.notes} onSave={(v) => patchEvent(e.id, { notes: v })} />
        </section>
      </div>

      {modal === 'share' && <ShareModal e={e} onClose={() => setModal(null)} />}
      {modal === 'add' && <ItemModal item={null} doors={e.time} onSave={saveItem} onClose={() => setModal(null)} />}
      {modal && typeof modal === 'object' && (
        <ItemModal item={modal} doors={e.time} onSave={saveItem} onClose={() => setModal(null)}
          onDelete={() => { setSchedule(e.schedule.filter((x) => x.id !== (modal as ScheduleItem).id)); toast('Item removed'); setModal(null) }} />)}
    </div>
  )
}
