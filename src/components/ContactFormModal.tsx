import { useState } from 'react'
import { Modal } from './ui'
import { CONTACT_CATEGORIES, type Contact, type ContactCategory } from '../types'
import { uid } from '../lib/dates'

export default function ContactFormModal({ initial, onSave, onClose }: { initial: Contact | null; onSave: (contact: Contact) => void | Promise<void>; onClose: () => void }) {
  const [f, setF] = useState({ name: initial?.name ?? '', category: (initial?.category ?? 'DJ') as ContactCategory, speciality: initial?.speciality ?? '', email: initial?.email ?? '', phone: initial?.phone ?? '', notes: initial?.notes ?? '' })
  const set = (k: keyof typeof f, v: string) => setF({ ...f, [k]: v })
  return (
    <Modal title={initial ? 'Edit contact' : 'Add contact'} lead="We only store name, category and contact details." onClose={onClose}>
      <div className="field"><label htmlFor="cn">Name</label><input id="cn" className="input" value={f.name} onChange={(e) => set('name', e.target.value)} autoComplete="off" /></div>
      <div className="grid-2">
        <div className="field"><label htmlFor="cc">Category</label>
          <select id="cc" className="select" value={f.category} onChange={(e) => set('category', e.target.value)}>{CONTACT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
        <div className="field"><label htmlFor="cs">What they do</label><input id="cs" className="input" placeholder="e.g. House & disco" value={f.speciality} onChange={(e) => set('speciality', e.target.value)} /></div>
      </div>
      <div className="grid-2">
        <div className="field"><label htmlFor="ce">Email</label><input id="ce" type="email" className="input" value={f.email} onChange={(e) => set('email', e.target.value)} /></div>
        <div className="field"><label htmlFor="cp">Phone</label><input id="cp" type="tel" className="input" value={f.phone} onChange={(e) => set('phone', e.target.value)} /></div>
      </div>
      <div className="field"><label htmlFor="cno">Notes about working together</label><textarea id="cno" className="textarea" style={{ minHeight: 80 }} value={f.notes} onChange={(e) => set('notes', e.target.value)} /></div>
      <div className="foot"><button className="btn outline" onClick={onClose}>Cancel</button>
        <button className="btn primary" disabled={!f.name.trim()} onClick={() => onSave({ id: initial?.id ?? uid(), isSample: initial?.isSample ?? false, createdAt: initial?.createdAt ?? new Date().toISOString(), ...f, name: f.name.trim() })}>{initial ? 'Save contact' : 'Add contact'}</button></div>
    </Modal>
  )
}
