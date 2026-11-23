import { WEEK_STARTS_ON } from '../config'
const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const D = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const pad = (n: number) => String(n).padStart(2, '0')

export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const todayISO = () => toISO(new Date())
export const parseISO = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
export const addDays = (iso: string, n: number) => { const d = parseISO(iso); d.setDate(d.getDate() + n); return toISO(d) }
// European order everywhere: day, month, year ("6 Nov", "6 Nov 2026", "Fri 6 Nov 2026")
export const fmtShort = (iso: string) => { const d = parseISO(iso); return `${d.getDate()} ${M[d.getMonth()]}` }
export const fmtFull = (iso: string) => { const d = parseISO(iso); return `${d.getDate()} ${M[d.getMonth()]} ${d.getFullYear()}` }
export const fmtLong = (iso: string) => { const d = parseISO(iso); return `${D[d.getDay()]} ${d.getDate()} ${M[d.getMonth()]} ${d.getFullYear()}` }
export const fmtCal = (iso: string) => { const d = parseISO(iso); return `${D[d.getDay()]} ${d.getDate()} ${M[d.getMonth()]}` }
/** Add whole months, keeping the day of month but never spilling into the next month (31 Jan + 1 month = 28/29 Feb). */
export const addMonths = (iso: string, n: number) => {
  const d = parseISO(iso)
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1)
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(d.getDate(), last))
  return toISO(target)
}
export const daysBetween = (a: string, b: string) => Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86400000)
export const monthName = (m: number) => MONTHS[m]
export const weekdayLetters = () => {
  const l = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  return WEEK_STARTS_ON === 1 ? [...l.slice(1), l[0]] : l
}
/** Weeks of ISO dates covering the month, including leading/trailing days. */
export function monthGrid(year: number, month: number) {
  const first = new Date(year, month, 1)
  const offset = (first.getDay() - WEEK_STARTS_ON + 7) % 7
  const cur = new Date(year, month, 1 - offset)
  const weeks: { iso: string; inMonth: boolean }[][] = []
  for (let w = 0; w < 6; w++) {
    const row: { iso: string; inMonth: boolean }[] = []
    for (let i = 0; i < 7; i++) { row.push({ iso: toISO(cur), inMonth: cur.getMonth() === month }); cur.setDate(cur.getDate() + 1) }
    if (w >= 4 && !row.some((c) => c.inMonth)) break
    weeks.push(row)
  }
  return weeks
}
export const uid = () => crypto.randomUUID()
export const newShareToken = () => {
  const a = new Uint8Array(16); crypto.getRandomValues(a)
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from(a, (b) => chars[b % chars.length]).join('')
}
export const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('')
