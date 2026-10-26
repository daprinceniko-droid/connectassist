import type { Contact, EventRec, Preset, SharedEvent } from '../types'
import { localDb } from './localDb'
import { supabaseDb, supabaseConfigured } from './supabaseDb'

export interface Db {
  mode: 'local' | 'supabase'
  loadAll(): Promise<{ events: EventRec[]; contacts: Contact[]; presets: Preset[] }>
  saveEvent(e: EventRec): Promise<void>
  deleteEvent(id: string): Promise<void>
  saveContact(c: Contact): Promise<void>
  deleteContact(id: string): Promise<void>
  savePreset(p: Preset): Promise<void>
  deletePreset(id: string): Promise<void>
  getShared(token: string): Promise<SharedEvent | null>
  insertMany(events: EventRec[], contacts: Contact[]): Promise<void>
  deleteSample(): Promise<void>
}

export const db: Db = supabaseConfigured ? supabaseDb : localDb
