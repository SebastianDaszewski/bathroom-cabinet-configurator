import { BOARDS, findDecor } from './catalog'
import type { Cutout, Edges, Panel } from './panels'

export interface CutListRow {
  name: string
  material: string
  decor: string
  length: number
  width: number
  thickness: number
  qty: number
  edges: string
  notes: string
}

const EDGE_LABELS: readonly [keyof Edges, string][] = [
  ['l1', 'L1'],
  ['l2', 'L2'],
  ['w1', 'W1'],
  ['w2', 'W2'],
]

function edgeLabel(edges: Edges): string {
  return EDGE_LABELS.filter(([key]) => edges[key])
    .map(([, label]) => label)
    .join(' ')
}

function materialLabel(panel: Panel): string {
  if (panel.board === 'hdf') return `HDF ${panel.thickness} mm`
  return BOARDS.find((board) => board.id === panel.board)?.name ?? panel.board
}

function decorLabel(panel: Panel): string {
  if (!panel.decor) return ''
  const decor = findDecor(panel.decor)
  return decor ? `${decor.code} ${decor.name}` : panel.decor
}

function cutoutNotes(cutouts: readonly Cutout[]): string {
  const notches = cutouts.filter((cutout) => cutout.kind === 'notch')
  const holes = cutouts.filter((cutout) => cutout.kind === 'hole')
  const notes = notches.map((notch) => `Siphon cut-out ${notch.length}×${notch.width}`)
  if (holes.length > 0) notes.push(`${holes.length} holes Ø${holes[0].diameter}`)
  return notes.join(', ')
}

function toRow(panel: Panel): CutListRow {
  return {
    name: panel.name,
    material: materialLabel(panel),
    decor: decorLabel(panel),
    length: panel.length,
    width: panel.width,
    thickness: panel.thickness,
    qty: 1,
    edges: edgeLabel(panel.edges),
    notes: cutoutNotes(panel.cutouts),
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
  'Name',
  'Material',
  'Decor',
  'Length (mm)',
  'Width (mm)',
  'Thickness (mm)',
  'Qty',
  'Edge banding',
  'Notes',
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
      row.notes,
    ]),
  ].map((fields) => fields.map(csvField).join(';'))

  return `﻿${lines.join('\r\n')}\r\n`
}
