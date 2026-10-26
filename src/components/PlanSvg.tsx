import type { PointerEvent as RPE, Ref, SVGProps } from 'react'
import type { FloorPlan, PlanItem } from '../types'
import { roomLayout, type Fixed } from '../lib/rooms'
import { canvasLabel, itemName } from '../lib/plan'

export interface PlanHandlers {
  down: (e: RPE<SVGGElement>, it: PlanItem) => void
  move: (e: RPE<SVGGElement>, it: PlanItem) => void
  up: (e: RPE<SVGGElement>, it: PlanItem) => void
  focus: (it: PlanItem) => void
}
const INK = '#0a0a0a'
const NS = { vectorEffect: 'non-scaling-stroke' } as const

function Fixture({ f }: { f: Fixed }) {
  const cx = f.x + f.w / 2, cy = f.y + f.h / 2
  const tall = f.h > f.w * 1.8
  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect x={f.x} y={f.y} width={f.w} height={f.h} rx={8} fill="#ececec" stroke="#b5b5b5" strokeDasharray="6 5" strokeWidth={1.2} {...NS} />
      {f.kind !== 'pillar' && (
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={22} fill="#8a8a8a" transform={tall ? `rotate(-90 ${cx} ${cy})` : undefined}>{f.label}</text>
      )}
    </g>
  )
}

function Entrance({ f }: { f: Fixed }) {
  const cx = f.x + f.w / 2, cy = f.y + f.h / 2
  const cap = { bottom: ['↓ Entrance', cx, f.y - 16, 'middle'], top: ['↑ Entrance', cx, f.y + f.h + 34, 'middle'], left: ['← Entrance', f.x + f.w + 16, cy, 'start'], right: ['Entrance →', f.x - 16, cy, 'end'] }[f.side ?? 'bottom'] as [string, number, number, 'middle' | 'start' | 'end']
  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect x={f.x} y={f.y} width={f.w} height={f.h} fill="#fff" />
      <text x={cap[1]} y={cap[2]} textAnchor={cap[3]} dominantBaseline="central" fontSize={22} fill="#8a8a8a">{cap[0]}</text>
    </g>
  )
}

function Shape({ it, sel, num }: { it: PlanItem; sel: boolean; num?: number }) {
  const { w, h } = it
  const label = canvasLabel(it)
  const txt = (fill: string, size = 24) => label && <text textAnchor="middle" dominantBaseline="central" fontSize={size} fill={fill} transform={`rotate(${-it.rot + (it.h > it.w * 1.8 ? -90 : 0)})`}>{label}</text>
  switch (it.kind) {
    case 'round':
      return (<>
        {sel && <circle r={w / 2 + 16} fill="none" stroke={INK} strokeDasharray="5 4" strokeWidth={1.5} {...NS} />}
        <circle r={w / 2} fill={sel ? INK : '#fff'} stroke={INK} strokeWidth={2} {...NS} />
        <text textAnchor="middle" dominantBaseline="central" fontSize={Math.max(18, w * 0.24)} fill={sel ? '#fff' : INK} transform={`rotate(${-it.rot})`}>{num}</text>
      </>)
    case 'long': return (<><rect x={-w / 2} y={-h / 2} width={w} height={h} rx={8} fill="#fff" stroke={INK} strokeWidth={1.6} {...NS} />{txt('#8a8a8a', 22)}</>)
    case 'sofa': return (<><rect x={-w / 2} y={-h / 2} width={w} height={h} rx={Math.min(h / 2, 30)} fill="#d9d9d9" />{txt('#222', 22)}</>)
    case 'stage': return (<><rect x={-w / 2} y={-h / 2} width={w} height={h} rx={18} fill={INK} />{txt('#fff', 28)}</>)
    case 'bar': return (<><rect x={-w / 2} y={-h / 2} width={w} height={h} rx={10} fill="#e1e1e1" />{txt(INK, 24)}</>)
    case 'plant': return (<><circle r={w / 2} fill="#d9d9d9" /><circle r={w * 0.16} fill="#8a8a8a" /></>)
    case 'dj': return (<><rect x={-w / 2} y={-h / 2} width={w} height={h} rx={14} fill="#fff" stroke={INK} strokeWidth={2} {...NS} />{txt(INK, 24)}</>)
    case 'door': return <rect x={-w / 2} y={-Math.max(h, 8) / 2} width={w} height={Math.max(h, 8)} fill={INK} />
    case 'seating': {
      const cols = it.cols ?? 1, rows = it.rows ?? 1, dots = []
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) dots.push(<circle key={`${r}-${c}`} cx={-w / 2 + 25 + c * 50} cy={-h / 2 + 25 + r * 50} r={18} fill="#fff" stroke={INK} strokeWidth={1.3} {...NS} />)
      return (<><rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#fff" fillOpacity={0.01} />{dots}</>)
    }
    default: return (<><rect x={-w / 2} y={-h / 2} width={w} height={h} rx={8} fill="#fff" stroke={INK} strokeDasharray="6 5" strokeWidth={1.6} {...NS} />{txt(INK, 22)}</>)
  }
}

export default function PlanSvg({ plan, selected, handlers, svgRef, onBackground, svgProps, className }: {
  plan: FloorPlan; selected?: string | null; handlers?: PlanHandlers; svgRef?: Ref<SVGSVGElement>
  onBackground?: () => void; svgProps?: SVGProps<SVGSVGElement>; className?: string
}) {
  const room = roomLayout(plan.room), P = 40
  const nums = new Map<string, number>()
  plan.items.filter((i) => i.kind === 'round').forEach((i, n) => nums.set(i.id, n + 1))
  return (
    <svg ref={svgRef} className={className} viewBox={`${-P} ${-P} ${room.w + 2 * P} ${room.h + 2 * P}`} role="img"
      aria-label={`Floor plan of ${plan.room} with ${plan.items.length} elements`} style={{ display: 'block', width: '100%', height: 'auto', touchAction: handlers ? 'none' : undefined, userSelect: 'none' }}
      fontFamily="Inter Variable, Inter, system-ui, sans-serif" onPointerDown={onBackground} {...svgProps}>
      <rect x={0} y={0} width={room.w} height={room.h} rx={24} fill="#fff" stroke={INK} strokeWidth={3} {...NS} />
      {room.fixed.filter((f) => f.kind !== 'entrance').map((f) => <Fixture key={f.id} f={f} />)}
      {room.fixed.filter((f) => f.kind === 'entrance').map((f) => <Entrance key={f.id} f={f} />)}
      {plan.items.map((it) => {
        const sel = selected === it.id
        return (
          <g key={it.id} transform={`translate(${it.x} ${it.y}) rotate(${it.rot})`} style={{ cursor: handlers ? 'grab' : undefined, outline: 'none' }}
            {...(handlers ? {
              tabIndex: 0, role: 'button', 'aria-label': `${itemName(it, plan.items)}${sel ? ' (selected)' : ''}`, 'aria-pressed': sel,
              onPointerDown: (e: RPE<SVGGElement>) => handlers.down(e, it), onPointerMove: (e: RPE<SVGGElement>) => handlers.move(e, it),
              onPointerUp: (e: RPE<SVGGElement>) => handlers.up(e, it), onFocus: () => handlers.focus(it),
            } : { style: { pointerEvents: 'none' } })}>
            <Shape it={it} sel={sel} num={nums.get(it.id)} />
            {sel && it.kind !== 'round' && <rect x={-it.w / 2 - 14} y={-Math.max(it.h, 10) / 2 - 14} width={it.w + 28} height={Math.max(it.h, 10) + 28} rx={16} fill="none" stroke={INK} strokeDasharray="5 4" strokeWidth={1.5} {...NS} />}
          </g>
        )
      })}
    </svg>
  )
}
