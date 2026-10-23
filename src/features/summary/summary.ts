import { findDecor, isGrained } from '../../domain/catalog'
import { topDepth, topThickness } from '../../domain/panels'
import { hasEdgeHandle, topLength } from '../../domain/rules'
import { priceDelta } from '../../domain/priceDelta'
import { DEFAULT_CONFIG, DRAWER_IDS, type Config, type DrawerId } from '../../domain/schema'
import {
  boardLabel,
  FRONT_GRAIN_LABELS,
  FRONT_TYPE_LABELS,
  HANDLE_DRILLING_LABELS,
  HANDLE_POSITION_LABELS,
  OPENING_LABELS,
  runnerLabel,
  SIDE_GRAIN_LABELS,
} from '../labels'

export interface SummaryRow {
  label: string
  value: string
  reset: Partial<Config>
}

export interface SummaryGroup {
  title: string
  rows: SummaryRow[]
}

function defaults(...fields: (keyof Config)[]): Partial<Config> {
  return Object.fromEntries(fields.map((field) => [field, DEFAULT_CONFIG[field]]))
}

export function rowCost(config: Config, row: SummaryRow): number {
  return 0 - priceDelta(config, row.reset)
}

function decorName(id: string): string {
  const decor = findDecor(id)
  return decor ? `${decor.name} (${decor.code})` : id
}

function drawerValue(config: Config, id: DrawerId): string {
  const drawer = config.drawers[id]
  return drawer.siphonCut ? `${drawer.length} mm, z wycięciem pod syfon` : `${drawer.length} mm`
}

function drawerLengthReset(config: Config, id: DrawerId): Partial<Config> {
  const length = DEFAULT_CONFIG.drawers[id].length
  return { drawers: { ...config.drawers, [id]: { ...config.drawers[id], length } } }
}

function dimensionRows(config: Config): SummaryRow[] {
  const { topExtensionLeft: left, topExtensionRight: right, topExtensionFront: front } = config
  const rows = [
    {
      label: 'Korpus',
      value: `${config.width} × ${config.height} × ${config.depth} mm`,
      reset: defaults('width', 'height', 'depth'),
    },
    {
      label: 'Blat',
      value: `${topLength(config)} × ${topDepth(config)} mm, ${topThickness(config)} mm`,
      reset: defaults('topThickening'),
    },
  ]
  if (left + right + front === 0) return rows
  return [
    ...rows,
    {
      label: 'Wydłużenia blatu',
      value: `lewo ${left}, prawo ${right}, przód ${front} mm`,
      reset: defaults('topExtensionLeft', 'topExtensionRight', 'topExtensionFront'),
    },
  ]
}

function materialRows(config: Config): SummaryRow[] {
  const rows: SummaryRow[] = [
    {
      label: 'Korpus',
      value: `${boardLabel(config.carcassBoard)}, ${decorName(config.carcassDecor)}`,
      reset: defaults('carcassBoard', 'carcassDecor'),
    },
  ]
  if (isGrained(config.carcassDecor)) {
    rows.push({
      label: 'Usłojenie boków',
      value: SIDE_GRAIN_LABELS[config.sideGrain],
      reset: defaults('sideGrain'),
    })
  }
  rows.push({
    label: 'Fronty',
    value: `${boardLabel(config.frontBoard)}, ${decorName(config.frontDecor)}`,
    reset: defaults('frontBoard', 'frontDecor'),
  })
  if (isGrained(config.frontDecor)) {
    const grain = FRONT_GRAIN_LABELS[config.frontGrain]
    rows.push({
      label: 'Usłojenie frontów',
      value: config.continuousGrain ? `${grain}, ciągłe` : grain,
      reset: defaults('frontGrain', 'continuousGrain'),
    })
  }
  rows.push(
    { label: 'Szuflady', value: decorName(config.drawerDecor), reset: defaults('drawerDecor') },
    {
      label: 'Dno szuflad',
      value: decorName(config.drawerBottomDecor),
      reset: defaults('drawerBottomDecor'),
    },
  )
  return rows
}

function drawerRows(config: Config): SummaryRow[] {
  const rows = [
    { label: 'Prowadnice', value: runnerLabel(config.runner), reset: defaults('runner') },
    { label: 'Otwieranie', value: OPENING_LABELS[config.opening], reset: defaults('opening') },
    { label: 'Górna', value: drawerValue(config, 'top'), reset: drawerLengthReset(config, 'top') },
    {
      label: 'Dolna',
      value: drawerValue(config, 'bottom'),
      reset: drawerLengthReset(config, 'bottom'),
    },
  ]
  if (!DRAWER_IDS.some((id) => config.drawers[id].siphonCut)) return rows

  const position =
    config.siphonPosition === 'center' ? 'na środku' : `środek ${config.siphonX} mm od lewego boku`
  return [
    ...rows,
    {
      label: 'Wycięcie pod syfon',
      value: `${config.siphonCutWidth} × ${config.siphonCutDepth} mm, ${position}`,
      reset: {
        drawers: {
          top: { ...config.drawers.top, siphonCut: false },
          bottom: { ...config.drawers.bottom, siphonCut: false },
        },
      },
    },
  ]
}

function frontRows(config: Config): SummaryRow[] {
  const front = FRONT_TYPE_LABELS[config.frontType]
  const handles =
    config.handleDrilling === 'none'
      ? HANDLE_DRILLING_LABELS.none
      : [
          HANDLE_DRILLING_LABELS[config.handleDrilling],
          `rozstaw ${config.handleSpacing} mm`,
          HANDLE_POSITION_LABELS[config.handlePosition].toLowerCase(),
        ].join(', ')

  return [
    {
      label: 'Front',
      value: hasEdgeHandle(config) ? `${front}, profil ${config.edgeHandleThickness} mm` : front,
      reset: defaults('frontType', 'edgeHandleThickness'),
    },
    {
      label: 'Uchwyty',
      value: handles,
      reset: defaults('handleDrilling', 'handleSpacing', 'handlePosition'),
    },
  ]
}

export function summaryGroups(config: Config): SummaryGroup[] {
  return [
    { title: 'Wymiary', rows: dimensionRows(config) },
    { title: 'Materiały', rows: materialRows(config) },
    { title: 'Szuflady', rows: drawerRows(config) },
    { title: 'Fronty i uchwyty', rows: frontRows(config) },
  ]
}
