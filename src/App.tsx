import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './state/AuthProvider'
import { StoreProvider, useStore } from './state/StoreProvider'
import { Splash } from './components/ui'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Gallery from './pages/Gallery'
import EventForm from './pages/EventForm'
import EventPage from './pages/EventPage'
import PostEvent from './pages/PostEvent'
import Rundown from './pages/Rundown'
import Contacts from './pages/Contacts'
import Search from './pages/Search'
import Shared from './pages/Shared'
import FloorPlanSoon from './pages/FloorPlanSoon'

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
      <Route path="/events/:id/floorplan" element={<FloorPlanSoon />} />
      <Route path="/rundown" element={<Rundown />} />
      <Route path="/contacts" element={<Contacts />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/s/:token" element={<Shared />} />
      <Route path="/*" element={<StoreProvider><Private /></StoreProvider>} />
    </Routes>
  )
}
