import { describe, expect, it } from 'vitest'
import { LABEL_FONT_SIZE, labelRect } from './snapshotLabels'

describe('labelRect', () => {
  it('centres the label box on its point', () => {
    const rect = labelRect({ text: '600 mm', x: 100, y: 50 }, 40, 1)
    expect(rect.x + rect.width / 2).toBe(100)
    expect(rect.y + rect.height / 2).toBe(50)
  })

  it('pads the text', () => {
    const rect = labelRect({ text: '600 mm', x: 0, y: 0 }, 40, 1)
    expect(rect.width).toBe(52)
    expect(rect.height).toBe(LABEL_FONT_SIZE + 6)
  })

  it('scales to the canvas pixel ratio', () => {
    const rect = labelRect({ text: '600 mm', x: 100, y: 50 }, 80, 2)
    expect(rect.x + rect.width / 2).toBe(200)
    expect(rect.y + rect.height / 2).toBe(100)
    expect(rect.width).toBe(104)
    expect(rect.height).toBe(2 * (LABEL_FONT_SIZE + 6))
  })
})
