import { useEffect, useRef, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export function Back({ to, label }: { to: string; label: string }) {
  return <Link to={to} className="btn back">← {label}</Link>
}

export function Modal({ title, lead, onClose, children }: { title: string; lead?: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    ref.current?.querySelector<HTMLElement>('input, textarea, select, button')?.focus()
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', key)
    return () => { window.removeEventListener('keydown', key); prev?.focus() }
  }, [onClose])
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <h2>{title}</h2>
        {lead && <p className="lead">{lead}</p>}
        {children}
      </div>
    </div>
  )
}

export function useGo() { const n = useNavigate(); return (to: string) => n(to) }

export const Splash = ({ text = 'Loading…' }: { text?: string }) => <div className="splash">{text}</div>
