import { findBoard, findDecor } from './catalog'
import type { Edges, GrainDirection, Panel } from './panels'

export interface CutListRow {
  name: string
  material: string
  decor: string
  length: number
  width: number
  thickness: number
  qty: number
  edges: string
  grain: string
  notes: string
}

const GRAIN_LABELS: Record<GrainDirection, string> = {
  length: 'wzdłuż długości',
  width: 'wzdłuż szerokości',
}

const EDGE_LABELS: readonly [keyof Edges, string][] = [
  ['l1', 'D1'],
  ['l2', 'D2'],
  ['w1', 'S1'],
  ['w2', 'S2'],
]

function edgeLabel(edges: Edges): string {
  return EDGE_LABELS.filter(([key]) => edges[key])
    .map(([, label]) => label)
    .join(' ')
}

function decorLabel(panel: Panel): string {
  const decor = findDecor(panel.decor)
  return decor ? `${decor.code} ${decor.name}` : panel.decor
}

function panelNotes(panel: Panel): string {
  const notes: string[] = []
  if (panel.cutouts.length > 0) {
    notes.push(`Otwory Ø${panel.cutouts[0].diameter}: ${panel.cutouts.length} szt.`)
  }
  if (panel.continuousGrain && panel.grain) notes.push('Ciągłe usłojenie frontów')
  return notes.join(', ')
}

function toRow(panel: Panel): CutListRow {
  return {
    name: panel.name,
    material: findBoard(panel.board).name,
    decor: decorLabel(panel),
    length: panel.length,
    width: panel.width,
    thickness: panel.thickness,
    qty: 1,
    edges: edgeLabel(panel.edges),
    grain: panel.grain ? GRAIN_LABELS[panel.grain] : '',
    notes: panelNotes(panel),
  }
}

function rowKey({ qty: _qty, ...row }: CutListRow): string {
  return JSON.stringify(row)
}

export function toCutList(panels: readonly Panel[]): CutListRow[] {
  const rows = new Map<string, CutListRow>()

  for (const panel of panels) {
    const row = toRow(panel)
    const key = rowKey(row)
    const existing = rows.get(key)
    if (existing) existing.qty += 1
    else rows.set(key, row)
  }

  return [...rows.values()]
}

const CSV_HEADER = [
  'Nazwa',
  'Materiał',
  'Dekor',
  'Długość (mm)',
  'Szerokość (mm)',
  'Grubość (mm)',
  'Ilość',
  'Okleina',
  'Usłojenie',
  'Uwagi',
]

function csvField(value: string | number): string {
  const text = String(value)
  return /[;"\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function toCsv(rows: readonly CutListRow[]): string {
  const lines = [
    CSV_HEADER,
    ...rows.map((row) => [
      row.name,
      row.material,
      row.decor,
      row.length,
      row.width,
      row.thickness,
      row.qty,
      row.edges,
      row.grain,
      row.notes,
    ]),
  ].map((fields) => fields.map(csvField).join(';'))

  return `\uFEFF${lines.join('\r\n')}\r\n`
}
