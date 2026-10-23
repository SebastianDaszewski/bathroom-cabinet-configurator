import { describe, expect, it } from 'vitest'
import { toCsv, toCutList, type CutListRow } from './cutlist'
import { buildPanels } from './panels'
import { DEFAULT_CONFIG } from './schema'

describe('toCutList', () => {
  const rows = toCutList(buildPanels(DEFAULT_CONFIG))

  it('merges identical panels and keeps every piece', () => {
    expect(rows.find((row) => row.name === 'Bok')).toMatchObject({ qty: 2 })
    expect(rows.reduce((sum, row) => sum + row.qty, 0)).toBe(10)
  })

  it('keeps panels that differ in size apart', () => {
    expect(rows.filter((row) => row.name === 'Front szuflady')).toHaveLength(2)
    expect(rows.find((row) => row.name === 'Dno szuflady')).toMatchObject({ qty: 2 })
  })

  it('lists the two pieces of a drawer back split for the siphon', () => {
    const backs = toCutList(
      buildPanels({
        ...DEFAULT_CONFIG,
        drawers: { ...DEFAULT_CONFIG.drawers, top: { length: 450, siphonCut: true } },
      }),
    ).filter((row) => row.name === 'Tył szuflady')
    expect(backs.map((row) => row.length)).toEqual([157, 156, 477])
  })

  it('merges fronts of equal height', () => {
    const fronts = toCutList(buildPanels({ ...DEFAULT_CONFIG, height: 503 })).filter(
      (row) => row.name === 'Front szuflady',
    )
    expect(fronts).toEqual([expect.objectContaining({ width: 250, qty: 2 })])
  })

  it('describes materials, decors and edge banding', () => {
    expect(rows[0]).toEqual({
      name: 'Bok',
      material: 'Płyta laminowana',
      decor: 'U732 Szary pyłowy',
      length: 500,
      width: 500,
      thickness: 18,
      qty: 2,
      edges: 'D1',
      notes: '',
    })
    expect(rows.find((row) => row.name === 'Wieniec górny')).toMatchObject({
      length: 600,
      width: 523,
      edges: 'D1 S1 S2',
    })
    expect(rows.find((row) => row.name === 'Front szuflady')?.edges).toBe('D1 D2 S1 S2')
  })

  it('lists handle holes', () => {
    const front = toCutList(buildPanels({ ...DEFAULT_CONFIG, handleDrilling: 'single' })).find(
      (row) => row.name === 'Front szuflady',
    )
    expect(front?.notes).toBe('Otwory Ø5: 2 szt.')
  })
})

describe('toCsv', () => {
  const row: CutListRow = {
    name: 'Bok',
    material: 'Płyta laminowana',
    decor: 'U732 Szary pyłowy',
    length: 500,
    width: 500,
    thickness: 18,
    qty: 2,
    edges: 'D1',
    notes: '',
  }

  it('starts with a BOM and a header, uses ; and CRLF', () => {
    expect(toCsv([row])).toBe(
      '\uFEFFNazwa;Materiał;Dekor;Długość (mm);Szerokość (mm);Grubość (mm);Ilość;Okleina;Uwagi\r\n' +
        'Bok;Płyta laminowana;U732 Szary pyłowy;500;500;18;2;D1;\r\n',
    )
  })

  it('quotes fields with separators or quotes', () => {
    const csv = toCsv([{ ...row, name: 'Bok; "lewy"' }])
    expect(csv).toContain('"Bok; ""lewy""";')
  })

  it('has one line per row', () => {
    const csv = toCsv(toCutList(buildPanels(DEFAULT_CONFIG)))
    expect(csv.trimEnd().split('\r\n')).toHaveLength(9)
  })
})
