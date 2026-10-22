import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

const Ctx = createContext<(msg: string, tone?: 'ok' | 'error') => void>(() => {})
export const useToast = () => useContext(Ctx)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [t, setT] = useState<{ msg: string; tone: 'ok' | 'error'; k: number } | null>(null)
  const timer = useRef<number>()
  const show = useCallback((msg: string, tone: 'ok' | 'error' = 'ok') => {
    window.clearTimeout(timer.current)
    setT({ msg, tone, k: Date.now() })
    timer.current = window.setTimeout(() => setT(null), tone === 'error' ? 6000 : 3200)
  }, [])
  return (
    <Ctx.Provider value={show}>
      {children}
      <div className="toast-wrap" role="status" aria-live="polite">
        {t && (
          <div key={t.k} className={`toast ${t.tone}`}>
            <span className="toast-dot">{t.tone === 'ok' ? '✓' : '!'}</span>
            {t.msg}
          </div>
        )}
      </div>
    </Ctx.Provider>
  )
}
