export const NOISE_PERIOD_MM = 600

function hash(x: number, y: number, seed: number): number {
  let h = (x * 374_761_393 + y * 668_265_263 + seed * 2_147_483_647) | 0
  h = Math.imul(h ^ (h >>> 13), 1_274_126_177)
  return ((h ^ (h >>> 16)) >>> 0) / 4_294_967_295
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t)
}

function wrap(value: number, period: number): number {
  return ((value % period) + period) % period
}

export function valueNoise(x: number, y: number, seed = 0, periodX = 256, periodY = 256): number {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const tx = smooth(x - x0)
  const ty = smooth(y - y0)
  const ax = wrap(x0, periodX)
  const bx = wrap(x0 + 1, periodX)
  const ay = wrap(y0, periodY)
  const by = wrap(y0 + 1, periodY)
  const a = hash(ax, ay, seed)
  const b = hash(bx, ay, seed)
  const c = hash(ax, by, seed)
  const d = hash(bx, by, seed)
  return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty
}

function tiledNoise(x: number, y: number, cellX: number, cellY: number, seed = 0): number {
  return valueNoise(x / cellX, y / cellY, seed, NOISE_PERIOD_MM / cellX, NOISE_PERIOD_MM / cellY)
}

export function tiledFbm(
  x: number,
  y: number,
  cellX: number,
  cellY: number,
  octaves: number,
  seed = 0,
): number {
  let sum = 0
  let amplitude = 0.5
  let total = 0
  for (let octave = 0; octave < octaves; octave++) {
    const scale = 2 ** octave
    sum += tiledNoise(x, y, cellX / scale, cellY / scale, seed + octave) * amplitude
    total += amplitude
    amplitude /= 2
  }
  return sum / total
}

const RING_COUNT = 14

export function woodShade(x: number, y: number): number {
  const warp = tiledFbm(x, y, 150, 40, 4, 1) * 60
  const rings = Math.sin(((y + warp) / NOISE_PERIOD_MM) * RING_COUNT * 2 * Math.PI) * 0.5 + 0.5
  const streaks = tiledFbm(x, y, 100, 2.5, 3, 2)
  const pores = tiledNoise(x, y, 1.5, 0.75, 3) > 0.93 ? 0.04 : 0
  return 1 - (rings * 0.07 + streaks * 0.09 + pores)
}

export function concreteShade(x: number, y: number): number {
  const clouds = tiledFbm(x, y, 60, 60, 5, 4)
  const speckle = tiledNoise(x, y, 1.2, 1.2, 5) > 0.97 ? 0.08 : 0
  return 1 - (clouds * 0.2 + speckle)
}

export function laminateShade(x: number, y: number): number {
  return 1 - tiledNoise(x, y, 2, 2, 6) * 0.035
}
