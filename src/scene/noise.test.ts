import { describe, expect, it } from 'vitest'
import {
  concreteShade,
  laminateShade,
  NOISE_PERIOD_MM,
  tiledFbm,
  valueNoise,
  woodShade,
} from './noise'

const samples = (shade: (x: number, y: number) => number) =>
  Array.from({ length: 400 }, (_, index) => shade((index * 37) % 600, (index * 53) % 600))

describe('noise', () => {
  it('is deterministic', () => {
    expect(valueNoise(12.3, 4.5)).toBe(valueNoise(12.3, 4.5))
    expect(tiledFbm(1, 2, 10, 10, 4)).toBe(tiledFbm(1, 2, 10, 10, 4))
  })

  it('stays within 0..1', () => {
    for (let index = 0; index < 500; index++) {
      const value = tiledFbm(index * 3.7, index * 1.1, 40, 40, 5)
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThanOrEqual(1)
    }
  })

  it('depends on the seed', () => {
    expect(valueNoise(3.3, 7.7, 1)).not.toBe(valueNoise(3.3, 7.7, 2))
  })

  it.each([
    ['wood', woodShade],
    ['concrete', concreteShade],
    ['laminate', laminateShade],
  ] as const)('%s tiles without a seam every 600 mm', (_name, shade) => {
    for (const [x, y] of [
      [0, 0],
      [123.4, 56.7],
      [599, 301],
    ]) {
      expect(shade(x + NOISE_PERIOD_MM, y)).toBeCloseTo(shade(x, y), 9)
      expect(shade(x, y + NOISE_PERIOD_MM)).toBeCloseTo(shade(x, y), 9)
    }
  })

  it.each([
    ['wood', woodShade, 0.8],
    ['concrete', concreteShade, 0.7],
    ['laminate', laminateShade, 0.95],
  ] as const)('%s shades stay light enough to tint the decor colour', (_name, shade, floor) => {
    for (const value of samples(shade)) {
      expect(value).toBeGreaterThanOrEqual(floor)
      expect(value).toBeLessThanOrEqual(1)
    }
  })

  it('draws wood grain along x: it varies more across than along the grain', () => {
    const along = Array.from({ length: 50 }, (_, x) => woodShade(x, 100))
    const across = Array.from({ length: 50 }, (_, y) => woodShade(100, y))
    const spread = (values: number[]) => Math.max(...values) - Math.min(...values)
    expect(spread(across)).toBeGreaterThan(spread(along))
  })
})
