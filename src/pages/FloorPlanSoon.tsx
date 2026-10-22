import { Link, useParams } from 'react-router-dom'
import { Back } from '../components/ui'

export default function FloorPlanSoon() {
  const { id } = useParams()
  return (
    <div className="page">
      <Back to={id ? `/events/${id}/rundown` : '/'} label="Rundown" />
      <h1 className="title">Floor plan</h1>
      <p className="subtitle" style={{ maxWidth: 560 }}>The floor plan builder is the last piece of V1 and isn’t in this build yet. Your rundown, events, contacts and sharing all work without it.</p>
      <Link className="btn primary" style={{ marginTop: 24 }} to={id ? `/events/${id}/rundown` : '/'}>Back to rundown</Link>
    </div>
  )
}
