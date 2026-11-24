import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './state/AuthProvider'
import { StoreProvider, useStore } from './state/StoreProvider'
import { Splash } from './components/ui'

const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Gallery = lazy(() => import('./pages/Gallery'))
const EventForm = lazy(() => import('./pages/EventForm'))
const EventPage = lazy(() => import('./pages/EventPage'))
const PostEvent = lazy(() => import('./pages/PostEvent'))
const Rundown = lazy(() => import('./pages/Rundown'))
const Contacts = lazy(() => import('./pages/Contacts'))
const Search = lazy(() => import('./pages/Search'))
const Shared = lazy(() => import('./pages/Shared'))
const FloorPlan = lazy(() => import('./pages/FloorPlan'))

function CursorSparkles() {
  useEffect(() => {
    const sparkles = new Set<HTMLSpanElement>()
    let lastSpawn = 0
    let active = false
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || event.timeStamp - lastSpawn < 180) return
      lastSpawn = event.timeStamp
      const count = Math.random() > 0.88 ? 2 : 1
      for (let index = 0; index < count; index += 1) {
        const sparkle = document.createElement('span')
        const random = Math.random()
        sparkle.className = `cursor-sparkle ${random > 0.7 ? 'cursor-sparkle-dot' : ''}`
        sparkle.setAttribute('aria-hidden', 'true')
        sparkle.textContent = random > 0.7 ? '' : random > 0.38 ? '✦' : '✧'
        const offsetX = (Math.random() - 0.5) * 22
        const offsetY = (Math.random() - 0.5) * 16
        sparkle.style.left = `${event.clientX + offsetX}px`
        sparkle.style.top = `${event.clientY + offsetY}px`
        sparkle.style.setProperty('--sparkle-delay', `${index * 18}ms`)
        sparkle.style.setProperty('--sparkle-drift', `${(Math.random() - 0.5) * 24}px`)
        sparkle.addEventListener('animationend', () => {
          sparkles.delete(sparkle)
          sparkle.remove()
        }, { once: true })
        sparkles.add(sparkle)
        document.body.append(sparkle)
      }
    }
    const update = () => {
      const shouldRun = document.documentElement.dataset.palette === '13'
        && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (shouldRun === active) return
      active = shouldRun
      if (active) window.addEventListener('pointermove', onPointerMove)
      else {
        window.removeEventListener('pointermove', onPointerMove)
        sparkles.forEach((sparkle) => sparkle.remove())
        sparkles.clear()
      }
    }
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-palette'] })
    update()
    return () => {
      observer.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      sparkles.forEach((sparkle) => sparkle.remove())
    }
  }, [])
  return null
}

function Private() {
  const { user, loading } = useAuth()
  const { loading: dataLoading } = useStore()
  const loc = useLocation()
  if (loading) return <Splash />
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname + loc.search }} replace />
  if (dataLoading) return <Splash text="Loading your events…" />
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/search" element={<Search />} />
      <Route path="/events/new" element={<EventForm />} />
      <Route path="/events/:id" element={<EventPage />} />
      <Route path="/events/:id/edit" element={<EventForm />} />
      <Route path="/events/:id/update" element={<PostEvent />} />
      <Route path="/events/:id/rundown" element={<Rundown />} />
      <Route path="/events/:id/floorplan" element={<FloorPlan />} />
      <Route path="/rundown" element={<Rundown />} />
      <Route path="/contacts" element={<Contacts />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  const { user } = useAuth()
  return (
    <>
      <CursorSparkles />
      <Suspense fallback={<Splash />}>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/s/:token" element={<Shared />} />
          <Route path="/*" element={<StoreProvider><Private /></StoreProvider>} />
        </Routes>
      </Suspense>
    </>
  )
}
