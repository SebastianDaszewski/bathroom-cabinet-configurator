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
  'edge-handle-ready': 'Pod uchwyt krawędziowy',
}

export const SIDE_GRAIN_LABELS: Record<Config['sideGrain'], string> = {
  vertical: 'Pionowe',
  horizontal: 'Poziome',
}

export const FRONT_GRAIN_LABELS: Record<Config['frontGrain'], string> = {
  horizontal: 'Poziome',
  vertical: 'Pionowe',
}

export const HANDLE_DRILLING_LABELS: Record<Config['handleDrilling'], string> = {
  none: 'Bez uchwytów',
  single: 'Jeden uchwyt',
  double: 'Dwa uchwyty',
}

export const TOP_THICKENING_LABELS: Record<Config['topThickening'], string> = {
  none: 'Standardowy 18 mm',
  double: 'Pogrubiony 36 mm',
}

export const HANDLE_POSITION_LABELS: Record<Config['handlePosition'], string> = {
  'top-50': '50 mm od góry',
  center: 'Na środku',
}

export const BOARD_DESCRIPTIONS: Record<string, string> = {
  chipboard: 'Płyta wiórowa laminowana: odporna, łatwa w utrzymaniu i najtańsza.',
  acrylic: 'Wysoki połysk na płycie, łatwy do umycia, widać na nim odciski palców.',
  mdf: 'Gładka płyta MDF o jednolitej powierzchni, także na krawędziach.',
  perfectsense: 'Głęboki, aksamitny mat odporny na odciski palców.',
}

export const RUNNER_DESCRIPTIONS: Record<Config['runner'], string> = {
  tandem: 'Szuflada z płyty na prowadnicach schowanych pod dnem. Boki szuflady są z płyty.',
  blum: 'Smukła metalowa skrzynka szuflady ze stalowymi bokami, bardzo stabilna.',
}

export const OPENING_DESCRIPTIONS: Record<Config['opening'], string> = {
  blumotion: 'Szuflada domyka się sama, cicho i bez trzaskania.',
  'tip-on': 'Bez uchwytów: lekkie naciśnięcie frontu wysuwa szufladę.',
}

export const FRONT_TYPE_DESCRIPTIONS: Record<Config['frontType'], string> = {
  standard: 'Płaski front, uchwyty można nawiercić osobno.',
  'grip-groove': 'Frezowane wcięcie przy górnej krawędzi frontu służy za uchwyt.',
  'edge-handle': 'Aluminiowy profil na górnej krawędzi frontu, w zestawie.',
  'edge-handle-ready': 'Front skrócony pod profil, który kupujesz i montujesz sam.',
}

export const HANDLE_DRILLING_DESCRIPTIONS: Record<Config['handleDrilling'], string> = {
  none: 'Fronty bez otworów.',
  single: 'Otwory pod jeden uchwyt na środku każdego frontu.',
  double: 'Otwory pod dwa uchwyty na każdym froncie, do szerokich szafek.',
}

export const TOP_THICKENING_DESCRIPTIONS: Record<Config['topThickening'], string> = {
  none: 'Blat z jednej płyty 18 mm.',
  double: 'Dwie sklejone płyty z jedną okleiną, krawędź 36 mm wygląda masywniej.',
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
  topExtensionLeft: 'Wydłużenie blatu w lewo',
  topExtensionRight: 'Wydłużenie blatu w prawo',
  topExtensionFront: 'Wydłużenie blatu do przodu',
  carcassDecor: 'Dekor korpusu',
  frontDecor: 'Dekor frontów',
  drawerDecor: 'Dekor szuflad',
  drawerBottomDecor: 'Dekor dna szuflad',
  continuousGrain: 'Ciągłe usłojenie',
  'drawers.top.length': 'Górna szuflada',
  'drawers.bottom.length': 'Dolna szuflada',
  siphonX: 'Pozycja wycięcia',
  siphonCutWidth: 'Szerokość wycięcia',
  siphonCutDepth: 'Długość wycięcia',
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
