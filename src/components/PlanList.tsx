import { Link } from 'react-router-dom'
import PlanSvg from './PlanSvg'
import { statLabel } from '../lib/plan'
import { planTitles } from '../lib/select'
import type { FloorPlan } from '../types'

/** All floor plans of an event, one under the other. Pass `linkFor` to make each one open in the editor. */
export default function PlanList({ plans, linkFor, linkLabel = 'Open' }: { plans: FloorPlan[]; linkFor?: (index: number) => string; linkLabel?: string }) {
  const titles = planTitles(plans.map((p) => p.room))
  return (
    <>
      {plans.map((p, i) => (
        <div key={i} style={{ marginTop: i ? 22 : 0 }}>
          {plans.length > 1 && <span className="eyebrow" style={{ display: 'block', marginBottom: 10 }}>{titles[i]}</span>}
          {linkFor
            ? <Link to={linkFor(i)} className="fp-box" style={{ display: 'block' }}><PlanSvg plan={p} /></Link>
            : <div className="fp-box"><PlanSvg plan={p} /></div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, gap: 10 }}>
            <b>{p.basedOn ?? 'Custom layout'} · {statLabel(p.items).split(' · ')[0]}</b>
            {linkFor && <Link className="link-arrow" to={linkFor(i)}>{linkLabel} ↗</Link>}
          </div>
        </div>
      ))}
    </>
  )
}
