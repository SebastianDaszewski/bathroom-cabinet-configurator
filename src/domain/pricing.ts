import { BOARDS, findDecor, findRunner } from './catalog'
import type { Panel, PanelMaterial } from './panels'
import { PRICING } from './pricing.config'
import { DRAWER_IDS, type Config } from './schema'

export const PRICE_CATEGORIES = ['boards', 'edging', 'hardware', 'machining', 'labour'] as const

export type PriceCategory = (typeof PRICE_CATEGORIES)[number]

export type PriceUnit = 'm²' | 'm' | 'pcs'

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
  carcass: 'Carcass',
  back: 'Back',
  front: 'Fronts',
  drawer: 'Drawer boxes',
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
  const modifier = panel.decor ? (findDecor(panel.decor)?.pricePerM2Modifier ?? 1) : 1
  return base * modifier
}

function boardLabel(panel: Panel): string {
  const board =
    panel.board === 'hdf'
      ? 'HDF'
      : (BOARDS.find((candidate) => candidate.id === panel.board)?.name ?? panel.board)
  const decor = panel.decor ? findDecor(panel.decor) : undefined
  return [MATERIAL_LABELS[panel.material], board, decor?.code].filter(Boolean).join(' · ')
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
  return [line('edging', 'Edge banding', length, 'm', PRICING.edgingPerM)]
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
    line('hardware', `Runners · ${runner.name}`, drawers, 'pcs', PRICING.runnerPair[runner.id]),
  ]

  if (config.opening === 'tip-on') {
    lines.push(line('hardware', 'Tip-On push-to-open', drawers, 'pcs', PRICING.tipOnUnit))
  }
  if (handles > 0) {
    lines.push(line('hardware', 'Handles', handles, 'pcs', PRICING.handle))
  }
  if (config.frontType === 'edge-handle') {
    lines.push(
      line(
        'hardware',
        'Edge handle profile',
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
    lines.push(line('machining', 'Siphon cut-outs', siphonCuts, 'pcs', PRICING.siphonCut))
  }
  if (holes > 0) {
    lines.push(line('machining', 'Handle holes', holes, 'pcs', PRICING.hole))
  }
  if (config.frontType === 'grip-groove') {
    lines.push(
      line('machining', 'Grip groove milling', frontsLength(panels), 'm', PRICING.gripGroovePerM),
    )
  }

  return lines
}

function labourLines(panels: readonly Panel[]): PriceLine[] {
  return [
    line('labour', 'Assembly and packing', 1, 'pcs', PRICING.labourBase),
    line('labour', 'Cutting and edging', panels.length, 'pcs', PRICING.labourPerPanel),
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
