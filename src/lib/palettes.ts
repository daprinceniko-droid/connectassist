export const PALETTE_STORAGE_KEY = 'connectassist-palette'

export const PALETTES = [
  { id: '0', name: 'Palette 0 · Default', colors: ['#0a0a0a', '#f3f3f3', '#fff'], foreground: '#fff' },
  { id: '1', name: 'Palette 1', colors: ['#3a71de', '#fff', '#ffcfd6'], foreground: '#fff' },
  { id: '2', name: 'Palette 2', colors: ['#8a1738', '#fff', '#f3cea1'], foreground: '#fff' },
  { id: '3', name: 'Palette 3', colors: ['#ff882e', '#fff', '#e8eb80'], foreground: '#0a0a0a' },
  { id: '4', name: 'Palette 4', colors: ['#3a71de', '#fff', '#002c60'], foreground: '#fff' },
  { id: '5', name: 'Palette 5', colors: ['#e8eb80', '#fff', '#002c60'], foreground: '#0a0a0a' },
  { id: '6', name: 'Palette 6', colors: ['#0a350f', '#fff', '#98b9e2'], foreground: '#fff' },
  { id: '7', name: 'Palette 7', colors: ['#fb4040', '#fff', '#8a1738'], foreground: '#0a0a0a' },
  { id: '8', name: 'Palette 8', colors: ['#377002', '#f3cea1', '#fff'], foreground: '#fff' },
  { id: '9', name: 'Palette 9', colors: ['#ff882e', '#fff', '#8a1738'], foreground: '#0a0a0a' },
  { id: '10', name: 'Palette 10', colors: ['#ffcfd6', '#fff', '#377002'], foreground: '#0a0a0a' },
  { id: '11', name: 'Palette 11', colors: ['#0a350f', '#e8eb80', '#fff'], foreground: '#fff' },
  { id: '12', name: 'Palette 12', colors: ['#fb4040', '#98b9e2', '#fff'], foreground: '#0a0a0a' },
  { id: '13', name: 'Pawl Palette', colors: ['#ff51bc', '#fff', '#680c57'], foreground: '#680c57' },
] as const

export type PaletteId = (typeof PALETTES)[number]['id']

export function getPaletteId(id: string | null): PaletteId {
  return PALETTES.find((palette) => palette.id === id)?.id ?? '0'
}

function getTextColors(background: string) {
  const hex = background.replace('#', '')
  const value = hex.length === 3
    ? hex.split('').map((character) => character + character).join('')
    : hex
  const red = parseInt(value.slice(0, 2), 16)
  const green = parseInt(value.slice(2, 4), 16)
  const blue = parseInt(value.slice(4, 6), 16)
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000

  return luminance < 145
    ? { foreground: '#fff', muted: '#d6d6d6', muted2: '#ededed' }
    : { foreground: '#0a0a0a', muted: '#666', muted2: '#454545' }
}

export function applyPalette(id: string | null): PaletteId {
  const paletteId = getPaletteId(id)
  const palette = PALETTES.find((option) => option.id === paletteId) ?? PALETTES[0]
  const root = document.documentElement
  root.dataset.palette = palette.id
  root.style.setProperty('--main-color', palette.colors[0])
  root.style.setProperty('--secondary-color', palette.colors[1])
  root.style.setProperty('--page-background', palette.colors[2])
  root.style.setProperty('--main-foreground', palette.foreground)
  if (paletteId === '0') {
    root.style.setProperty('--muted', '#8a8a8a')
    root.style.setProperty('--muted-2', '#969696')
    root.style.setProperty('--card-muted', '#8a8a8a')
    root.style.setProperty('--card-muted-2', '#969696')
    root.style.setProperty('--page-muted', '#8a8a8a')
    root.style.setProperty('--page-muted-2', '#969696')
    root.style.setProperty('--page-foreground', '#0a0a0a')
    root.style.setProperty('--card-foreground', '#0a0a0a')
  } else {
    const cardText = getTextColors(palette.colors[1])
    const pageText = getTextColors(palette.colors[2])
    root.style.setProperty('--muted', cardText.muted)
    root.style.setProperty('--muted-2', cardText.muted2)
    root.style.setProperty('--card-muted', cardText.muted)
    root.style.setProperty('--card-muted-2', cardText.muted2)
    root.style.setProperty('--page-muted', pageText.muted)
    root.style.setProperty('--page-muted-2', pageText.muted2)
    root.style.setProperty('--page-foreground', pageText.foreground)
    root.style.setProperty('--card-foreground', cardText.foreground)
  }
  return paletteId
}
