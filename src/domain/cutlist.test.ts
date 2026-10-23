import { describe, expect, it } from 'vitest'
import { toCsv, toCutList, type CutListRow } from './cutlist'
import { buildPanels } from './panels'
import { DEFAULT_CONFIG } from './schema'

describe('toCutList', () => {
  const rows = toCutList(buildPanels(DEFAULT_CONFIG))

  it('merges identical panels and keeps every piece', () => {
    expect(rows.find((row) => row.name === 'Side')).toMatchObject({ qty: 2 })
    expect(rows.reduce((sum, row) => sum + row.qty, 0)).toBe(12)
  })

  it('keeps panels that differ in size or machining apart', () => {
    expect(rows.filter((row) => row.name === 'Drawer front')).toHaveLength(2)
    expect(rows.filter((row) => row.name === 'Drawer bottom').map((row) => row.notes)).toEqual([
      'Siphon cut-out 218×200',
      '',
    ])
  })

  it('merges fronts of equal height', () => {
    const fronts = toCutList(buildPanels({ ...DEFAULT_CONFIG, height: 503 })).filter(
      (row) => row.name === 'Drawer front',
    )
    expect(fronts).toEqual([expect.objectContaining({ width: 250, qty: 2 })])
  })

  it('describes materials, decors and edge banding', () => {
    expect(rows[0]).toEqual({
      name: 'Side',
      material: 'Laminated chipboard',
      decor: 'U732 Dust grey',
      length: 500,
      width: 500,
      thickness: 18,
      qty: 2,
      edges: 'L1',
      notes: '',
    })
    expect(rows.find((row) => row.name === 'Back')).toMatchObject({
      material: 'HDF 3 mm',
      decor: '',
      edges: '',
    })
    expect(rows.find((row) => row.name === 'Drawer front')?.edges).toBe('L1 L2 W1 W2')
  })

  it('lists handle holes', () => {
    const front = toCutList(buildPanels({ ...DEFAULT_CONFIG, handleDrilling: 'single' })).find(
      (row) => row.name === 'Drawer front',
    )
    expect(front?.notes).toBe('2 holes Ø5')
  })
})

describe('toCsv', () => {
  const row: CutListRow = {
    name: 'Side',
    material: 'Laminated chipboard',
    decor: 'U732 Dust grey',
    length: 500,
    width: 500,
    thickness: 18,
    qty: 2,
    edges: 'L1',
    notes: '',
  }

  it('starts with a BOM and a header, uses ; and CRLF', () => {
    expect(toCsv([row])).toBe(
      '﻿Name;Material;Decor;Length (mm);Width (mm);Thickness (mm);Qty;Edge banding;Notes\r\n' +
        'Side;Laminated chipboard;U732 Dust grey;500;500;18;2;L1;\r\n',
    )
  })

  it('quotes fields with separators or quotes', () => {
    const csv = toCsv([{ ...row, name: 'Side; "left"' }])
    expect(csv).toContain('"Side; ""left""";')
  })

  it('has one line per row', () => {
    const csv = toCsv(toCutList(buildPanels(DEFAULT_CONFIG)))
    expect(csv.trimEnd().split('\r\n')).toHaveLength(12)
  })
})
