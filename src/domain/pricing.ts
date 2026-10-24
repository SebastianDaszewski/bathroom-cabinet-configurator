import { findBoard, findDecor, findRunner } from './catalog'
import type { Panel, PanelMaterial } from './panels'
import { PRICING } from './pricing.config'
import { DRAWER_IDS, type Config } from './schema'

export const PRICE_CATEGORIES = ['boards', 'edging', 'hardware', 'machining', 'labour'] as const

export type PriceCategory = (typeof PRICE_CATEGORIES)[number]

type PriceUnit = 'm²' | 'm' | 'szt.'

export interface PriceLine {
  category: PriceCategory
  label: string
  quantity: number
  unit: PriceUnit
  unitPrice: number
  amount: number
}

export interface Price {
  total: number
  lines: PriceLine[]
}

const MM_PER_M = 1000

const MATERIAL_LABELS: Record<PanelMaterial, string> = {
  carcass: 'Korpus',
  front: 'Fronty',
  drawer: 'Szuflady',
}

function line(
  category: PriceCategory,
  label: string,
  quantity: number,
  unit: PriceUnit,
  rate: number,
): PriceLine {
  const unitPrice = rate * PRICING.margin * 100
  return {
    category,
    label,
    quantity: Math.round(quantity * 1000) / 1000,
    unit,
    unitPrice: Math.round(unitPrice),
    amount: Math.round(quantity * unitPrice),
  }
}

function panelArea(panel: Panel): number {
  return (panel.length * panel.width) / (MM_PER_M * MM_PER_M)
}

function bandedLength(panel: Panel): number {
  const { l1, l2, w1, w2 } = panel.edges
  const lengths = [l1, l2].filter(Boolean).length * panel.length
  const widths = [w1, w2].filter(Boolean).length * panel.width
  return (lengths + widths) / MM_PER_M
}

function boardRate(panel: Panel): number {
  const base =
    panel.material === 'drawer' ? PRICING.drawerBoardPerM2 : PRICING.boardPerM2[panel.board]
  const modifier = findDecor(panel.decor)?.pricePerM2Modifier ?? 1
  return base * modifier
}

function boardLabel(panel: Panel): string {
  const board = findBoard(panel.board).name
  const decor = findDecor(panel.decor)
  const material = [board, decor?.code].filter(Boolean).join(' ')
  return `${MATERIAL_LABELS[panel.material]}: ${material}`
}

function boardLines(panels: readonly Panel[]): PriceLine[] {
  const groups = new Map<string, { label: string; rate: number; area: number }>()

  for (const panel of panels) {
    const label = boardLabel(panel)
    const group = groups.get(label) ?? { label, rate: boardRate(panel), area: 0 }
    group.area += panelArea(panel)
    groups.set(label, group)
  }

  return [...groups.values()].map((group) =>
    line('boards', group.label, group.area, 'm²', group.rate),
  )
}

function edgingLines(panels: readonly Panel[]): PriceLine[] {
  const length = panels.reduce((sum, panel) => sum + bandedLength(panel), 0)
  return [line('edging', 'Okleina', length, 'm', PRICING.edgingPerM)]
}

function frontsLength(panels: readonly Panel[]): number {
  return panels
    .filter((panel) => panel.material === 'front')
    .reduce((sum, panel) => sum + panel.length / MM_PER_M, 0)
}

function holeCount(panels: readonly Panel[]): number {
  return panels.reduce(
    (sum, panel) => sum + panel.cutouts.filter((cutout) => cutout.kind === 'hole').length,
    0,
  )
}

function hardwareLines(config: Config, panels: readonly Panel[]): PriceLine[] {
  const drawers = DRAWER_IDS.length
  const runner = findRunner(config.runner)
  const handles = holeCount(panels) / 2
  const lines = [
    line('hardware', `Prowadnice: ${runner.name}`, drawers, 'szt.', PRICING.runnerPair[runner.id]),
  ]

  if (config.opening === 'tip-on') {
    lines.push(
      line('hardware', 'Tip-On (otwieranie przez naciśnięcie)', drawers, 'szt.', PRICING.tipOnUnit),
    )
  }
  if (handles > 0) {
    lines.push(line('hardware', 'Uchwyty', handles, 'szt.', PRICING.handle))
  }
  if (config.frontType === 'edge-handle') {
    lines.push(
      line(
        'hardware',
        'Profil uchwytu krawędziowego',
        frontsLength(panels),
        'm',
        PRICING.edgeHandleProfilePerM,
      ),
    )
  }

  return lines
}

function machiningLines(config: Config, panels: readonly Panel[]): PriceLine[] {
  const siphonCuts = DRAWER_IDS.filter((id) => config.drawers[id].siphonCut).length
  const holes = holeCount(panels)
  const lines: PriceLine[] = []

  if (siphonCuts > 0) {
    lines.push(line('machining', 'Wycięcia pod syfon', siphonCuts, 'szt.', PRICING.siphonCut))
  }
  if (holes > 0) {
    lines.push(line('machining', 'Otwory pod uchwyty', holes, 'szt.', PRICING.hole))
  }
  if (config.frontType === 'grip-groove') {
    lines.push(
      line('machining', 'Frezowanie uchwytu', frontsLength(panels), 'm', PRICING.gripGroovePerM),
    )
  }

  return lines
}

function labourLines(panels: readonly Panel[]): PriceLine[] {
  return [
    line('labour', 'Montaż i pakowanie', 1, 'szt.', PRICING.labourBase),
    line('labour', 'Cięcie i oklejanie', panels.length, 'szt.', PRICING.labourPerPanel),
  ]
}

export function price(config: Config, panels: readonly Panel[]): Price {
  const lines = [
    ...boardLines(panels),
    ...edgingLines(panels),
    ...hardwareLines(config, panels),
    ...machiningLines(config, panels),
    ...labourLines(panels),
  ]

  return { total: lines.reduce((sum, priceLine) => sum + priceLine.amount, 0), lines }
}

export function subtotals(lines: readonly PriceLine[]): Record<PriceCategory, number> {
  const totals = Object.fromEntries(PRICE_CATEGORIES.map((category) => [category, 0])) as Record<
    PriceCategory,
    number
  >
  for (const priceLine of lines) totals[priceLine.category] += priceLine.amount
  return totals
}
