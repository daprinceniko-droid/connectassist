import type { MouseEvent } from 'react'
import { useStore } from '../state/StoreProvider'
import type { EventRec } from '../types'

/** The tickable to-do items of an event. Used on the home page ("Next up") and on the event page. */
export default function TodoItems({ event }: { event: EventRec }) {
  const { patchEvent } = useStore()
  const toggle = (ev: MouseEvent, id: string) => {
    ev.stopPropagation() // the "Next up" card on the home page is a link: ticking must not open the event
    patchEvent(event.id, { todos: event.todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) })
  }
  return (
    <>
      {event.todos.map((t) => (
        <li key={t.id}>
          <button aria-pressed={t.done} className={t.done ? 'done' : ''} onClick={(ev) => toggle(ev, t.id)}>
            <span className="box">{t.done ? '✓' : ''}</span>{t.text}
          </button>
        </li>
      ))}
    </>
  )
}
