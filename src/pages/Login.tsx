import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthProvider'

export default function Login() {
  const { signIn } = useAuth()
  const nav = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/'
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr(null)
    const r = await signIn(email.trim(), pw)
    setBusy(false)
    if (r) setErr(r); else nav(from, { replace: true })
  }
  return (
    <div className="center">
      <form className="login" onSubmit={submit}>
        <h1>ConnectAssist</h1>
        <p className="subtitle">Sign in to plan events for The Social Hub The Hague.</p>
        <div className="field"><label htmlFor="em">Email</label>
          <input id="em" className="input pill-input" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="field"><label htmlFor="pw">Password</label>
          <input id="pw" className="input pill-input" type="password" autoComplete="current-password" required value={pw} onChange={(e) => setPw(e.target.value)} /></div>
        {err && <p className="error-text" role="alert">{err}</p>}
        <button className="btn primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  )
}
