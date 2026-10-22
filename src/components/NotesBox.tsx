import { useEffect, useRef, useState } from 'react'

/** Notes that save themselves ~0.8s after you stop typing. */
export default function NotesBox({ value, onSave, white = false, rows }: { value: string; onSave: (v: string) => void; white?: boolean; rows?: number }) {
  const [v, setV] = useState(value)
  const [state, setState] = useState<'idle' | 'dirty' | 'saved'>('idle')
  const timer = useRef<number>()
  const latest = useRef({ v, onSave }); latest.current = { v, onSave }
  useEffect(() => () => { if (timer.current) { window.clearTimeout(timer.current); latest.current.onSave(latest.current.v) } }, [])
  const change = (nv: string) => {
    setV(nv); setState('dirty'); window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => { timer.current = undefined; onSave(nv); setState('saved') }, 800)
  }
  return (
    <>
      <textarea className={white ? 'white-box' : 'notes-area'} style={white ? { width: '100%', border: 0, minHeight: 90, resize: 'vertical', font: 'inherit' } : undefined}
        rows={rows} aria-label="Notes" placeholder="Anything worth remembering for next time…" value={v} onChange={(e) => change(e.target.value)} />
      <p className="saved" aria-live="polite">{state === 'dirty' ? 'Saving…' : 'Saved automatically'}</p>
    </>
  )
}
