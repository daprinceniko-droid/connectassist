import { lazy, Suspense } from 'react'
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
    <Suspense fallback={<Splash />}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/s/:token" element={<Shared />} />
        <Route path="/*" element={<StoreProvider><Private /></StoreProvider>} />
      </Routes>
    </Suspense>
  )
}
