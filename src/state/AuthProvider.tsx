import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase, supabaseConfigured } from '../data/supabaseClient'

interface AuthState {
  user: { name: string; email: string } | null
  loading: boolean
  demo: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}
const Ctx = createContext<AuthState>(null as never)
export const useAuth = () => useContext(Ctx)

const nameFrom = (email: string) => {
  const p = email.split('@')[0].split(/[._-]/)[0]
  return p ? p[0].toUpperCase() + p.slice(1) : 'there'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthState['user']>(supabaseConfigured ? null : { name: 'Pawl', email: '' })
  const [loading, setLoading] = useState(supabaseConfigured)

  useEffect(() => {
    if (!supabaseConfigured) return
    const apply = (email?: string | null) => setUser(email ? { email, name: nameFrom(email) } : null)
    supabase.auth.getSession().then(({ data }) => { apply(data.session?.user.email); setLoading(false) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e: unknown, s: { user: { email?: string } } | null) => apply(s?.user.email))
    return () => sub.subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error ? 'That email and password don’t match. Check both and try again.' : null
  }
  const signOut = async () => { if (supabaseConfigured) await supabase.auth.signOut() }

  return <Ctx.Provider value={{ user, loading, demo: !supabaseConfigured, signIn, signOut }}>{children}</Ctx.Provider>
}
