import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource-variable/inter'
import './styles.css'
import App from './App'
import { AuthProvider } from './state/AuthProvider'
import { ToastProvider } from './state/ToastProvider'
import { applyPalette, PALETTE_STORAGE_KEY } from './lib/palettes'

applyPalette(window.localStorage.getItem(PALETTE_STORAGE_KEY))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)
