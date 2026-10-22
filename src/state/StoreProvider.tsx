import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Contact, EventRec } from '../types'
import { db } from '../data/db'
import { buildSample } from '../data/sample'
import { newShareToken } from '../lib/dates'
import { useAuth } from './AuthProvider'
import { useToast } from './ToastProvider'

interface Store {
  loading: boolean
  events: EventRec[]
  contacts: Contact[]
  hasSample: boolean
  saveEvent: (e: EventRec) => Promise<void>
  patchEvent: (id: string, patch: Partial<EventRec>) => Promise<void>
  deleteEvent: (id: string) => Promise<void>
  saveContact: (c: Contact) => Promise<void>
  deleteContact: (id: string) => Promise<void>
  ensureShareToken: (id: string) => Promise<string>
  stopSharing: (id: string) => Promise<void>
  loadSample: () => Promise<void>
  removeSample: () => Promise<void>
}
const Ctx = createContext<Store>(null as never)
export const useStore = () => useContext(Ctx)

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<EventRec[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const ev = useRef(events); ev.current = events

  const reload = useCallback(async () => {
    try {
      const d = await db.loadAll()
      setEvents(d.events); setContacts(d.contacts)
    } catch (e) {
      toast(`Couldn’t load your data: ${(e as Error).message}`, 'error')
    } finally { setLoading(false) }
  }, [toast])

  useEffect(() => { if (user) { setLoading(true); reload() } }, [user, reload])

  /** Optimistic update; if the database refuses, tell the user and re-sync. */
  const run = async (apply: () => void, write: () => Promise<void>) => {
    apply()
    try { await write() } catch (e) { toast(`Not saved: ${(e as Error).message}. Reloading your data.`, 'error'); await reload() }
  }
  const upsert = <T extends { id: string }>(l: T[], x: T) => (l.some((i) => i.id === x.id) ? l.map((i) => (i.id === x.id ? x : i)) : [...l, x])

  const saveEvent = (e: EventRec) => run(() => setEvents((l) => upsert(l, e)), () => db.saveEvent(e))
  const patchEvent = async (id: string, patch: Partial<EventRec>) => {
    const cur = ev.current.find((e) => e.id === id)
    if (cur) await saveEvent({ ...cur, ...patch })
  }
  const deleteEvent = (id: string) => run(() => setEvents((l) => l.filter((e) => e.id !== id)), () => db.deleteEvent(id))
  const saveContact = (c: Contact) => run(() => setContacts((l) => upsert(l, c)), () => db.saveContact(c))
  const deleteContact = (id: string) =>
    run(() => {
      setContacts((l) => l.filter((c) => c.id !== id))
      setEvents((l) => l.map((e) => ({ ...e, contactIds: e.contactIds.filter((x) => x !== id) })))
    }, () => db.deleteContact(id))

  const ensureShareToken = async (id: string) => {
    const cur = ev.current.find((e) => e.id === id)
    if (!cur) throw new Error('Event not found')
    if (cur.shareToken) return cur.shareToken
    const token = newShareToken()
    await saveEvent({ ...cur, shareToken: token })
    return token
  }
  const stopSharing = (id: string) => patchEvent(id, { shareToken: null })

  const loadSample = async () => {
    const s = buildSample()
    await run(() => { setContacts((l) => [...l, ...s.contacts]); setEvents((l) => [...l, ...s.events]) }, () => db.insertMany(s.events, s.contacts))
  }
  const removeSample = async () => {
    await run(() => {
      const gone = new Set(contacts.filter((c) => c.isSample).map((c) => c.id))
      setContacts((l) => l.filter((c) => !c.isSample))
      setEvents((l) => l.filter((e) => !e.isSample).map((e) => ({ ...e, contactIds: e.contactIds.filter((x) => !gone.has(x)) })))
    }, () => db.deleteSample())
  }

  const hasSample = events.some((e) => e.isSample) || contacts.some((c) => c.isSample)
  return (
    <Ctx.Provider value={{ loading, events, contacts, hasSample, saveEvent, patchEvent, deleteEvent, saveContact, deleteContact, ensureShareToken, stopSharing, loadSample, removeSample }}>
      {children}
    </Ctx.Provider>
  )
}
