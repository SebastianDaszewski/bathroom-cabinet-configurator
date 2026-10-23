import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from 'three'
import type { DecorFinish } from '../domain/catalog'
import { concreteShade, laminateShade, woodShade } from './noise'
import type { GrainAxis } from './panelShape'

export const TEXTURE_SIZE_MM = 600
const TEXTURE_PIXELS = 512
const MM_PER_PIXEL = TEXTURE_SIZE_MM / TEXTURE_PIXELS

const SHADERS: Record<DecorFinish, (x: number, y: number) => number> = {
  wood: woodShade,
  concrete: concreteShade,
  plain: laminateShade,
}

const cache = new Map<string, Texture>()

function paint(finish: DecorFinish, axis: GrainAxis): Texture {
  const canvas = document.createElement('canvas')
  canvas.width = TEXTURE_PIXELS
  canvas.height = TEXTURE_PIXELS
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D is not available')

  const image = context.createImageData(TEXTURE_PIXELS, TEXTURE_PIXELS)
  const shade = SHADERS[finish]
  for (let py = 0; py < TEXTURE_PIXELS; py++) {
    for (let px = 0; px < TEXTURE_PIXELS; px++) {
      const x = px * MM_PER_PIXEL
      const y = py * MM_PER_PIXEL
      const value = Math.round(255 * (axis === 'u' ? shade(x, y) : shade(y, x)))
      const index = (py * TEXTURE_PIXELS + px) * 4
      image.data[index] = value
      image.data[index + 1] = value
      image.data[index + 2] = value
      image.data[index + 3] = 255
    }
  }
  context.putImageData(image, 0, 0)

  const texture = new CanvasTexture(canvas)
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

export function decorTexture(finish: DecorFinish, axis: GrainAxis | null): Texture {
  const key = `${finish}-${axis ?? 'u'}`
  let texture = cache.get(key)
  if (!texture) {
    texture = paint(finish, axis ?? 'u')
    cache.set(key, texture)
  }
  return texture
}
