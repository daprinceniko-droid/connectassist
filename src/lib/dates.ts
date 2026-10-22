import { WEEK_STARTS_ON } from '../config'
const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const D = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const pad = (n: number) => String(n).padStart(2, '0')

export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const todayISO = () => toISO(new Date())
export const parseISO = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
export const addDays = (iso: string, n: number) => { const d = parseISO(iso); d.setDate(d.getDate() + n); return toISO(d) }
export const fmtShort = (iso: string) => { const d = parseISO(iso); return `${M[d.getMonth()]} ${d.getDate()}` }
export const fmtFull = (iso: string) => { const d = parseISO(iso); return `${M[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}` }
export const fmtCal = (iso: string) => { const d = parseISO(iso); return `${D[d.getDay()]} ${d.getDate()} ${M[d.getMonth()]}` }
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
