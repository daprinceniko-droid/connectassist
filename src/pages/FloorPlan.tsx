import { useEffect, useMemo, useRef, useState, type DragEvent, type KeyboardEvent, type PointerEvent as RPE } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../state/StoreProvider'
import { useToast } from '../state/ToastProvider'
import { Back, Modal } from '../components/ui'
import PlanSvg, { type PlanHandlers } from '../components/PlanSvg'
import { fmtShort, uid } from '../lib/dates'
import { ROOM_NAMES, roomLayout } from '../lib/rooms'
import { KIND_META, PALETTE, STARTERS, clampItem, itemName, newItem, planStats, snap, starterItems, statLabel } from '../lib/plan'
import { downloadFloorPlanPdf } from '../lib/pdf'
import type { FloorPlan, PlanItem, PlanKind } from '../types'

const INK = '#0a0a0a'
function PalIcon({ kind }: { kind: PlanKind }) {
  const s = { fill: '#fff', stroke: INK, strokeWidth: 1.6 }
  return (
    <svg width="46" height="28" viewBox="0 0 46 28" aria-hidden>
      {kind === 'round' && <circle cx="23" cy="14" r="11" {...s} />}
      {kind === 'long' && <rect x="5" y="6" width="36" height="16" rx="5" {...s} />}
      {kind === 'sofa' && <rect x="6" y="8" width="34" height="12" rx="6" fill="#d0d0d0" />}
      {kind === 'stage' && <rect x="6" y="6" width="34" height="16" rx="5" fill={INK} />}
      {kind === 'bar' && <rect x="6" y="10" width="34" height="8" rx="4" fill={INK} />}
      {kind === 'plant' && <><circle cx="23" cy="14" r="9" fill="#d0d0d0" /><circle cx="23" cy="14" r="3.5" fill="#8a8a8a" /></>}
      {kind === 'dj' && <rect x="13" y="3" width="20" height="22" rx="6" {...s} />}
      {kind === 'door' && <rect x="6" y="12" width="34" height="3" fill={INK} />}
      {kind === 'seating' && [0, 1, 2].flatMap((r) => [0, 1, 2, 3].map((c) => <circle key={`${r}${c}`} cx={12 + c * 7.5} cy={6 + r * 8} r="2.8" {...s} strokeWidth="1.1" />))}
    </svg>
  )
}

export default function FloorPlanPage() {
  const { id } = useParams()
  const { events, presets, savePreset, deletePreset, patchEvent } = useStore()
  const toast = useToast()
  const e = events.find((x) => x.id === id)
  const eRef = useRef(e); eRef.current = e

  const [plan, setPlan] = useState<FloorPlan>(() => e?.floorPlan ?? { room: ROOM_NAMES.includes(e?.room ?? '') ? e!.room : ROOM_NAMES[0], items: [] })
  const planRef = useRef(plan); planRef.current = plan
  const [past, setPast] = useState<FloorPlan[]>([])
  const [future, setFuture] = useState<FloorPlan[]>([])
  const [sel, setSel] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [saved, setSaved] = useState<'idle' | 'dirty' | 'saved'>('idle')
  const [modal, setModal] = useState<'preset' | 'custom' | null>(null)
  const dirty = useRef(false)
  const svgEl = useRef<SVGSVGElement>(null)
  const drag = useRef<{ id: string; dx: number; dy: number; moved: boolean } | null>(null)
  const room = roomLayout(plan.room)

  const flush = () => {
    const cur = eRef.current
    if (!dirty.current || !cur) return
    dirty.current = false
    const p = planRef.current
    patchEvent(cur.id, { floorPlan: p, needsFloorPlan: true, room: p.room, todos: cur.todos.map((t) => (t.text === 'Floor plan' ? { ...t, done: true } : t)) })
    setSaved('saved')
  }
  useEffect(() => { if (!dirty.current) return; setSaved('dirty'); const t = window.setTimeout(flush, 800); return () => window.clearTimeout(t) /* eslint-disable-next-line */ }, [plan])
  useEffect(() => () => flush() /* eslint-disable-next-line */, [])

  const push = () => { setPast((p) => [...p.slice(-99), planRef.current]); setFuture([]) }
  const commit = (next: FloorPlan) => { push(); setPlan(next); dirty.current = true }
  const edited = (items: PlanItem[]): FloorPlan => ({ room: plan.room, items }) // any manual change makes it a custom layout
  const undo = () => { if (!past.length) return; setFuture([plan, ...future]); setPlan(past[past.length - 1]); setPast(past.slice(0, -1)); dirty.current = true; setSel(null) }
  const redo = () => { if (!future.length) return; setPast([...past, plan]); setPlan(future[0]); setFuture(future.slice(1)); dirty.current = true; setSel(null) }

  const selected = plan.items.find((i) => i.id === sel) ?? null
  const patchItem = (patch: Partial<PlanItem>) => selected && commit(edited(plan.items.map((i) => (i.id === selected.id ? { ...i, ...patch } : i))))
  const add = (kind: PlanKind, x?: number, y?: number, o: Partial<PlanItem> = {}) => {
    const n = plan.items.length % 6
    const it = newItem(kind, snap(x ?? room.w / 2) + (x === undefined ? n * 20 : 0), snap(y ?? room.h / 2) + (y === undefined ? n * 20 : 0), o)
    commit(edited([...plan.items, clampItem(it, room)])); setSel(it.id)
  }
  const remove = () => { if (selected) { commit(edited(plan.items.filter((i) => i.id !== selected.id))); setSel(null) } }
  const duplicate = () => { if (selected) { const c = { ...selected, id: uid(), x: selected.x + 40, y: selected.y + 40 }; commit(edited([...plan.items, clampItem(c, room)])); setSel(c.id) } }
  const applyPreset = (name: string, items: PlanItem[]) => { commit({ room: plan.room, items: items.map((i) => ({ ...i, id: uid() })), basedOn: name }); setSel(null) }
  const changeRoom = (r: string) => { const l = roomLayout(r); commit({ ...plan, room: r, items: plan.items.map((i) => clampItem(i, l)) }) }

  const toSvg = (ev: { clientX: number; clientY: number }) => {
    const svg = svgEl.current!, pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse()); return { x: p.x, y: p.y }
  }
  const handlers: PlanHandlers = {
    down: (ev, it) => { ev.stopPropagation(); setSel(it.id); const p = toSvg(ev); drag.current = { id: it.id, dx: it.x - p.x, dy: it.y - p.y, moved: false }; ev.currentTarget.setPointerCapture(ev.pointerId) },
    move: (ev: RPE<SVGGElement>, it) => {
      const d = drag.current; if (!d || d.id !== it.id) return
      const p = toSvg(ev), nx = snap(p.x + d.dx), ny = snap(p.y + d.dy)
      const cur = planRef.current.items.find((i) => i.id === it.id)!
      if (nx === cur.x && ny === cur.y) return
      if (!d.moved) { push(); d.moved = true }
      dirty.current = true
      setPlan({ ...planRef.current, basedOn: undefined, items: planRef.current.items.map((i) => (i.id === it.id ? clampItem({ ...i, x: nx, y: ny }, room) : i)) })
    },
    up: () => { drag.current = null },
    focus: (it) => setSel(it.id),
  }
  const onKey = (ev: KeyboardEvent) => {
    const t = ev.target as HTMLElement
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return
    const mod = ev.ctrlKey || ev.metaKey
    if (mod && ev.key.toLowerCase() === 'z') { ev.preventDefault(); ev.shiftKey ? redo() : undo(); return }
    if (mod && ev.key.toLowerCase() === 'y') { ev.preventDefault(); redo(); return }
    if (!selected) return
    if (ev.key === 'Delete' || ev.key === 'Backspace') { ev.preventDefault(); remove(); return }
    const step = ev.shiftKey ? 50 : 10
    const dir: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }
    if (dir[ev.key]) { ev.preventDefault(); const [dx, dy] = dir[ev.key]; patchItem(clampItem({ ...selected, x: selected.x + dx, y: selected.y + dy }, room)) }
  }
  const onDrop = (ev: DragEvent) => {
    ev.preventDefault(); const k = ev.dataTransfer.getData('text/plain') as PlanKind
    if (!(k in KIND_META)) return
    const p = toSvg(ev); add(k, snap(p.x), snap(p.y))
  }

  const starters = useMemo(() => STARTERS.map((n) => ({ name: n, items: starterItems(plan.room, n) })), [plan.room])
  const mine = presets.filter((p) => p.room === plan.room)

  if (!e) return <div className="page"><Back to="/gallery" label="Gallery" /><p className="subtitle" style={{ marginTop: 24 }}>That event no longer exists.</p></div>
  const isSeating = selected?.kind === 'seating'
  const hasSeats = selected && (selected.kind === 'round' || selected.kind === 'long' || selected.kind === 'sofa')
  const resizable = selected && !['round', 'plant', 'seating', 'door'].includes(selected.kind) || selected?.kind === 'door'

  return (
    <div className="page" onKeyDown={onKey}>
      <Back to={`/events/${e.id}`} label="Event" />
      <div className="head" style={{ marginTop: 6 }}>
        <div><h1 className="title" style={{ marginBottom: 8 }}>Floor plan</h1><p className="subtitle">{e.name} · {fmtShort(e.date)} · {plan.room}</p></div>
        <div className="actions">
          <button className="btn" onClick={() => setModal('preset')}>Save as preset</button>
          <button className="btn primary" onClick={async () => { flush(); await downloadFloorPlanPdf(e.name, e.date, plan); toast('PDF exported') }}>Export PDF</button>
        </div>
      </div>

      <div className="fp-grid">
        <aside className="card" aria-label="Elements" style={{ padding: 22 }}>
          <span className="eyebrow">Elements</span>
          <div className="pal-grid">
            {[...PALETTE, 'seating' as PlanKind].map((k) => (
              <button key={k} className="pal" draggable onDragStart={(ev) => ev.dataTransfer.setData('text/plain', k)} onClick={() => add(k)}>
                <PalIcon kind={k} />{k === 'seating' ? 'Seating' : KIND_META[k].name}</button>))}
          </div>
          <button className="dashed" style={{ marginTop: 14 }} onClick={() => setModal('custom')}>+ Custom element</button>
        </aside>

        <section className="canvas-card" aria-label="Canvas">
          <div className="canvas-bar">
            <select className="select" style={{ width: 'auto', borderRadius: 20, padding: '10px 40px 10px 18px', fontWeight: 500 }} aria-label="Room layout" value={plan.room} onChange={(ev) => changeRoom(ev.target.value)}>
              {ROOM_NAMES.map((r) => <option key={r}>{r}</option>)}</select>
            <span className="pill" aria-live="polite">{statLabel(plan.items)}</span>
          </div>
          <div className="fp-scroll" onDragOver={(ev) => ev.preventDefault()} onDrop={onDrop}>
            <div style={{ width: `${zoom * 100}%` }}>
              <PlanSvg plan={plan} selected={sel} handlers={handlers} svgRef={svgEl} onBackground={() => setSel(null)} />
            </div>
          </div>
          <div className="canvas-foot">
            <span className="saved">Room outlines are approximate · {saved === 'dirty' ? 'Saving…' : 'Saved automatically'}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <span className="zoom"><button aria-label="Undo" disabled={!past.length} onClick={undo}>↶</button><button aria-label="Redo" disabled={!future.length} onClick={redo}>↷</button></span>
              <span className="zoom"><button aria-label="Zoom out" disabled={zoom <= 0.5} onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}>−</button><b>{Math.round(zoom * 100)}%</b><button aria-label="Zoom in" disabled={zoom >= 2} onClick={() => setZoom((z) => Math.min(2, z + 0.25))}>+</button></span>
            </div>
          </div>
        </section>

        <div className="stack">
          <section className="card dark" aria-label="Presets" style={{ padding: 24 }}>
            <h3 style={{ margin: 0, fontSize: 24 }}>Presets</h3>
            <p style={{ color: '#a8a8a8', fontSize: 14, margin: '4px 0 14px' }}>Start from a saved layout</p>
            <div className="preset-list">
              {starters.map((s) => (
                <button key={s.name} className={`preset ${plan.basedOn === s.name ? 'on' : ''}`} aria-pressed={plan.basedOn === s.name} onClick={() => applyPreset(s.name, s.items)}>
                  <span>{s.name}</span><small>{s.name === 'Blank' ? 'empty' : statLabel(s.items).split(' · ')[0]}</small></button>))}
              {mine.map((p) => (
                <div key={p.id} className="preset-wrap">
                  <button className={`preset ${plan.basedOn === p.name ? 'on' : ''}`} aria-pressed={plan.basedOn === p.name} onClick={() => applyPreset(p.name, p.items)}>
                    <span>{p.name}</span><small>{statLabel(p.items).split(' · ')[0]}</small></button>
                  <button className="x" aria-label={`Delete preset ${p.name}`} onClick={async () => { await deletePreset(p.id); toast('Preset deleted') }}>×</button>
                </div>))}
            </div>
          </section>

          <section className="card" aria-label="Selected element" style={{ padding: 24 }}>
            <span className="eyebrow">Selected</span>
            {!selected ? <p className="empty-note" style={{ marginTop: 10 }}>Click an element on the plan. Arrow keys nudge it, Delete removes it.</p> : (
              <>
                <h3 style={{ margin: '6px 0 14px', fontSize: 22, letterSpacing: '-0.01em' }}>{isSeating ? 'Seating block' : itemName(selected, plan.items)}</h3>
                <div className="grid-2" style={{ gap: 12 }}>
                  {hasSeats && <div className="field"><label htmlFor="se">Seats</label><input id="se" className="input" type="number" min={0} value={selected.seats ?? 0} onChange={(ev) => patchItem({ seats: Math.max(0, Number(ev.target.value) || 0) })} /></div>}
                  {isSeating && <div className="field"><label htmlFor="ro">Rows</label><input id="ro" className="input" type="number" min={1} max={30} value={selected.rows ?? 1} onChange={(ev) => { const r = Math.min(30, Math.max(1, Number(ev.target.value) || 1)); patchItem({ rows: r, h: r * 50 }) }} /></div>}
                  {isSeating && <div className="field"><label htmlFor="co">Per row</label><input id="co" className="input" type="number" min={1} max={30} value={selected.cols ?? 1} onChange={(ev) => { const c = Math.min(30, Math.max(1, Number(ev.target.value) || 1)); patchItem({ cols: c, w: c * 50 }) }} /></div>}
                  <div className="field"><label htmlFor="rt">Rotation</label><input id="rt" className="input" type="number" step={15} value={selected.rot} onChange={(ev) => patchItem({ rot: ((Number(ev.target.value) || 0) % 360 + 360) % 360 })} /></div>
                  {resizable && <div className="field"><label htmlFor="wd">Width (m)</label><input id="wd" className="input" type="number" min={0.1} step={0.1} value={+(selected.w / 100).toFixed(2)} onChange={(ev) => patchItem({ w: Math.max(10, Math.round((Number(ev.target.value) || 0.1) * 100)) })} /></div>}
                  {resizable && selected.kind !== 'door' && <div className="field"><label htmlFor="ln">Length (m)</label><input id="ln" className="input" type="number" min={0.1} step={0.1} value={+(selected.h / 100).toFixed(2)} onChange={(ev) => patchItem({ h: Math.max(10, Math.round((Number(ev.target.value) || 0.1) * 100)) })} /></div>}
                </div>
                {!['round', 'plant', 'door', 'seating'].includes(selected.kind) && <div className="field" style={{ marginTop: 12 }}><label htmlFor="lb">Label</label><input id="lb" className="input" value={selected.label ?? KIND_META[selected.kind].label ?? ''} onChange={(ev) => patchItem({ label: ev.target.value })} /></div>}
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}><button className="btn white" onClick={duplicate}>Duplicate</button><button className="btn outline" onClick={remove}>Delete</button></div>
              </>)}
          </section>
        </div>
      </div>

      {modal === 'preset' && <SavePreset defaultName={plan.basedOn && !STARTERS.includes(plan.basedOn as never) ? plan.basedOn : ''} room={plan.room} onClose={() => setModal(null)}
        onSave={async (name) => {
          const ex = mine.find((p) => p.name.toLowerCase() === name.toLowerCase())
          await savePreset({ id: ex?.id ?? uid(), name, room: plan.room, items: plan.items, createdAt: ex?.createdAt ?? new Date().toISOString() })
          setPlan({ ...plan, basedOn: name }); dirty.current = true; setModal(null); toast('Preset saved') }} />}
      {modal === 'custom' && <CustomEl onClose={() => setModal(null)} onAdd={(label, w, h) => { add('custom', undefined, undefined, { label, w, h }); setModal(null); toast('Custom element added') }} />}
      <p className="saved" style={{ marginTop: 18 }}><Link to={`/events/${e.id}/rundown`} style={{ textDecoration: 'underline' }}>Back to rundown</Link></p>
    </div>
  )
}

function SavePreset({ defaultName, room, onSave, onClose }: { defaultName: string; room: string; onSave: (n: string) => void; onClose: () => void }) {
  const [n, setN] = useState(defaultName)
  return (
    <Modal title="Save as preset" lead={`Reuse this layout for future events in ${room}.`} onClose={onClose}>
      <div className="field"><label htmlFor="pn">Preset name</label><input id="pn" className="input" placeholder="e.g. Pawl’s cabaret" value={n} onChange={(ev) => setN(ev.target.value)} onKeyDown={(ev) => ev.key === 'Enter' && n.trim() && onSave(n.trim())} /></div>
      <div className="foot"><button className="btn outline" onClick={onClose}>Cancel</button><button className="btn primary" disabled={!n.trim()} onClick={() => onSave(n.trim())}>Save preset</button></div>
    </Modal>
  )
}
function CustomEl({ onAdd, onClose }: { onAdd: (l: string, w: number, h: number) => void; onClose: () => void }) {
  const [l, setL] = useState(''), [w, setW] = useState('2'), [h, setH] = useState('1')
  const ok = l.trim() && Number(w) > 0 && Number(h) > 0
  return (
    <Modal title="Custom element" lead="Anything that isn’t in the palette: a photo wall, a buffet, a projector screen." onClose={onClose}>
      <div className="field"><label htmlFor="cl">Name</label><input id="cl" className="input" value={l} onChange={(ev) => setL(ev.target.value)} placeholder="e.g. Photo wall" /></div>
      <div className="grid-2"><div className="field"><label htmlFor="cw">Width (m)</label><input id="cw" className="input" type="number" min={0.1} step={0.1} value={w} onChange={(ev) => setW(ev.target.value)} /></div>
        <div className="field"><label htmlFor="ch">Length (m)</label><input id="ch" className="input" type="number" min={0.1} step={0.1} value={h} onChange={(ev) => setH(ev.target.value)} /></div></div>
      <div className="foot"><button className="btn outline" onClick={onClose}>Cancel</button><button className="btn primary" disabled={!ok} onClick={() => onAdd(l.trim(), Math.round(Number(w) * 100), Math.round(Number(h) * 100))}>Add element</button></div>
    </Modal>
  )
}
