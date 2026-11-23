import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useStore } from '../state/StoreProvider'
import { useToast } from '../state/ToastProvider'
import { Back, Modal } from '../components/ui'
import ContactFormModal from '../components/ContactFormModal'
import { CONTACT_CATEGORIES } from '../types'
import { fmtShort, initials } from '../lib/dates'
import { eventsOf } from '../lib/select'

const PLURAL: Record<string, string> = { DJ: 'DJs', Food: 'Food', Drinks: 'Drinks', Sponsor: 'Sponsors', 'Arts & Crafts': 'Arts & Crafts', Other: 'Other' }

export default function Contacts() {
  const { contacts, events, saveContact, deleteContact } = useStore()
  const toast = useToast()
  const [sp, setSp] = useSearchParams()
  const [cat, setCat] = useState<string>('All')
  const [q, setQ] = useState('')
  const [selId, setSelId] = useState<string | null>(sp.get('c'))
  const [modal, setModal] = useState<'add' | 'edit' | 'remove' | null>(null)

  const count = (c: string) => contacts.filter((x) => c === 'All' || x.category === c).length
  const list = contacts.filter((c) => (cat === 'All' || c.category === cat) && (!q || `${c.name} ${c.speciality} ${c.category}`.toLowerCase().includes(q.toLowerCase())))
  const sel = contacts.find((c) => c.id === selId) ?? list[0]
  useEffect(() => { if (sp.get('c')) { const c = contacts.find((x) => x.id === sp.get('c')); if (c) { setCat('All'); setSelId(c.id) } } }, [sp, contacts])
  const booked = sel ? eventsOf(sel, events) : []
  const past = booked.filter((e) => e.date <= new Date().toISOString().slice(0, 10))

  return (
    <div className="page with-side">
      <aside className="side" style={{ minHeight: 'calc(100vh - 32px)' }}>
        <div><Back to="/" label="Home" /></div>
        <span className="eyebrow">Category</span>
        {['All', ...CONTACT_CATEGORIES.filter((c) => c !== 'Other' || count('Other') > 0)].map((c) => (
          <button key={c} className={`nav-row ${cat === c ? 'on' : ''}`} aria-pressed={cat === c} onClick={() => { setCat(c); setSelId(null); setSp({}) }}>
            <span>{c === 'All' ? 'All contacts' : PLURAL[c]}</span><span className="n">{count(c)}</span></button>))}
        <p className="side-note">We only store name, category and contact details. You can remove a contact at any time.</p>
      </aside>
      <main className="side-main">
        <div className="head" style={{ marginBottom: 0 }}>
          <div><h1 className="title" style={{ marginTop: 0 }}>Contacts</h1><p className="subtitle">Everyone you’ve worked with, in one place.</p></div>
          <div className="actions"><input className="input pill-input" style={{ width: 270 }} aria-label="Search contacts" placeholder="Search contacts…" value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="btn primary" onClick={() => setModal('add')}>+ Add contact</button></div>
        </div>
        <div className="contacts-layout">
          <div>
            <div className="ccards">
              {list.map((c) => {
                const last = eventsOf(c, events).find((e) => e.date <= new Date().toISOString().slice(0, 10))
                return (
                  <button key={c.id} className={`ccard ${sel?.id === c.id ? 'on' : ''}`} aria-pressed={sel?.id === c.id} onClick={() => setSelId(c.id)}>
                    <div className="who"><span className="avatar">{initials(c.name)}</span><div><b>{c.name}</b><small>{c.speciality || c.category}</small></div></div>
                    <div className="foot"><span className="pill">{c.category}</span><small>{last ? `Last booked ${fmtShort(last.date)}` : 'Not booked yet'}</small></div>
                  </button>)
              })}
            </div>
            {list.length === 0 && <p className="empty-note">{contacts.length === 0 ? 'No contacts yet. Add the first DJ, caterer or sponsor you work with.' : 'No contacts match.'}</p>}
          </div>
          {sel && (
            <aside className="detail" aria-label="Contact details">
              <div className="top"><span className="avatar lg">{initials(sel.name)}</span><div><h2>{sel.name}</h2><p className="sub">{sel.category}{sel.speciality && ` · ${sel.speciality}`}</p></div></div>
              <div className="kv"><span>Email</span><span>{sel.email || '—'}</span></div>
              <div className="kv"><span>Phone</span><span>{sel.phone || '—'}</span></div>
              <div className="kv"><span>Last booked</span><span>{past[0] ? `${fmtShort(past[0].date)} · ${past[0].name}` : '—'}</span></div>
              <div className="kv"><span>Times booked</span><span>{booked.length}</span></div>
              {booked.length > 0 && <>
                <span className="eyebrow" style={{ display: 'block', margin: '14px 0 10px' }}>Booked for</span>
                <div className="chip-row">{booked.slice(0, 8).map((e) => <Link key={e.id} to={`/events/${e.id}`} className="pill link">{e.name}</Link>)}</div></>}
              {sel.notes && <div className="white-box" style={{ marginTop: 16 }}>{sel.notes}</div>}
              <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
                <button className="btn white" onClick={() => setModal('edit')}>Edit</button>
                <button className="btn outline" style={{ marginLeft: 'auto' }} onClick={() => setModal('remove')}>Remove contact</button>
              </div>
            </aside>)}
        </div>
      </main>
      {modal === 'add' && <ContactFormModal initial={null} onClose={() => setModal(null)} onSave={async (c) => { await saveContact(c); setSelId(c.id); setCat('All'); setModal(null); toast('Contact added to the directory') }} />}
      {modal === 'edit' && sel && <ContactFormModal initial={sel} onClose={() => setModal(null)} onSave={async (c) => { await saveContact(c); setModal(null); toast('Contact updated') }} />}
      {modal === 'remove' && sel && (
        <Modal title={`Remove ${sel.name}?`} lead="Their details are deleted for good and they’re taken off every event they were linked to. Past events keep their name, date and guest numbers." onClose={() => setModal(null)}>
          <div className="foot"><button className="btn outline" onClick={() => setModal(null)}>Keep contact</button>
            <button className="btn primary" onClick={async () => { await deleteContact(sel.id); setSelId(null); setModal(null); toast('Contact removed') }}>Remove contact</button></div>
        </Modal>)}
    </div>
  )
}
