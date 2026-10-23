import { BOARDS, DECORS, RUNNERS } from '../domain/catalog'
import type { Adjustment } from '../domain/rules'
import type { PriceCategory } from '../domain/pricing'
import type { Config } from '../domain/schema'

export const OPENING_LABELS: Record<Config['opening'], string> = {
  blumotion: 'Cichy domyk (Blumotion)',
  'tip-on': 'Otwieranie naciśnięciem (Tip-On)',
}

export const SIPHON_POSITION_LABELS: Record<Config['siphonPosition'], string> = {
  center: 'Na środku',
  custom: 'Własna pozycja',
}

export const FRONT_TYPE_LABELS: Record<Config['frontType'], string> = {
  standard: 'Gładki',
  'grip-groove': 'Frezowany uchwyt',
  'edge-handle': 'Uchwyt krawędziowy',
}

export const HANDLE_DRILLING_LABELS: Record<Config['handleDrilling'], string> = {
  none: 'Bez uchwytów',
  single: 'Jeden uchwyt',
  double: 'Dwa uchwyty',
}

export const HANDLE_POSITION_LABELS: Record<Config['handlePosition'], string> = {
  'top-50': '50 mm od góry',
  center: 'Na środku',
}

export const PRICE_CATEGORY_LABELS: Record<PriceCategory, string> = {
  boards: 'Płyty',
  edging: 'Okleina',
  hardware: 'Okucia',
  machining: 'Obróbka',
  labour: 'Robocizna',
}

const FIELD_LABELS: Record<string, string> = {
  width: 'Szerokość',
  height: 'Wysokość',
  depth: 'Głębokość',
  carcassDecor: 'Dekor korpusu',
  frontDecor: 'Dekor frontów',
  drawerDecor: 'Dekor szuflad',
  'drawers.top.length': 'Górna szuflada',
  'drawers.bottom.length': 'Dolna szuflada',
  siphonOffset: 'Szerokość wycięcia',
  siphonX: 'Pozycja wycięcia',
  edgeHandleThickness: 'Grubość uchwytu krawędziowego',
  handleDrilling: 'Uchwyty',
  handleSpacing: 'Rozstaw uchwytu',
}

const ENUM_LABELS: Record<string, Record<string, string>> = {
  handleDrilling: HANDLE_DRILLING_LABELS,
}

function valueLabel(field: string, value: Adjustment['from']): string {
  if (typeof value === 'number') return `${value} mm`
  if (typeof value === 'boolean') return value ? 'tak' : 'nie'
  const enumLabel = ENUM_LABELS[field]?.[value]
  if (enumLabel) return enumLabel
  return DECORS.find((decor) => decor.id === value)?.name ?? value
}

export function describeAdjustment(adjustment: Adjustment): {
  title: string
  reason: string
} {
  const field = FIELD_LABELS[adjustment.field] ?? adjustment.field
  const from = valueLabel(adjustment.field, adjustment.from)
  const to = valueLabel(adjustment.field, adjustment.to)
  return { title: `${field}: ${from} → ${to}`, reason: adjustment.reason }
}

export function boardLabel(id: string): string {
  return BOARDS.find((board) => board.id === id)?.name ?? id
}

export function runnerLabel(id: string): string {
  return RUNNERS.find((runner) => runner.id === id)?.name ?? id
}
