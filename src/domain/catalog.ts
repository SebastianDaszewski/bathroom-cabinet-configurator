import type { BoardType, RunnerType } from './schema'

export interface Board {
  id: BoardType
  name: string
}

export interface Decor {
  id: string
  name: string
  code: string
  /** Hex colour used for flat shading in the 3D view. */
  color: string
  texture?: string
  /** Board types this decor is available on (R9). */
  boards: readonly BoardType[]
  /** Multiplier applied to the board price per m². */
  pricePerM2Modifier: number
}

export interface Runner {
  id: RunnerType
  name: string
}

export const BOARDS: readonly Board[] = [
  { id: 'chipboard', name: 'Laminated chipboard' },
  { id: 'acrylic', name: 'Acrylic high-gloss' },
  { id: 'mdf', name: 'Lacquered MDF' },
  { id: 'perfectsense', name: 'PerfectSense matt' },
]

/** Drawer boxes are always made of laminated chipboard. */
export const DRAWER_BOARD: BoardType = 'chipboard'

export const DECORS: readonly Decor[] = [
  {
    id: 'white-w960',
    name: 'Classic white',
    code: 'W960',
    color: '#f2f1ec',
    boards: ['chipboard', 'acrylic', 'mdf'],
    pricePerM2Modifier: 1,
  },
  {
    id: 'grey-u732',
    name: 'Dust grey',
    code: 'U732',
    color: '#8d8f8c',
    boards: ['chipboard', 'acrylic', 'mdf'],
    pricePerM2Modifier: 1,
  },
  {
    id: 'graphite-u961',
    name: 'Graphite',
    code: 'U961',
    color: '#3d3f41',
    boards: ['chipboard', 'mdf'],
    pricePerM2Modifier: 1.05,
  },
  {
    id: 'oak-h1145',
    name: 'Natural oak',
    code: 'H1145',
    color: '#b8915f',
    boards: ['chipboard'],
    pricePerM2Modifier: 1.15,
  },
  {
    id: 'walnut-h3734',
    name: 'Walnut',
    code: 'H3734',
    color: '#7b5a3e',
    boards: ['chipboard'],
    pricePerM2Modifier: 1.2,
  },
  {
    id: 'concrete-f186',
    name: 'Light concrete',
    code: 'F186',
    color: '#a7a6a1',
    boards: ['chipboard'],
    pricePerM2Modifier: 1.1,
  },
  {
    id: 'black-ps01',
    name: 'Matt black',
    code: 'PS01',
    color: '#1f1f1f',
    boards: ['perfectsense'],
    pricePerM2Modifier: 1,
  },
  {
    id: 'greige-ps02',
    name: 'Matt greige',
    code: 'PS02',
    color: '#b5aca1',
    boards: ['perfectsense'],
    pricePerM2Modifier: 1,
  },
]

export const RUNNERS: readonly Runner[] = [
  { id: 'tandem', name: 'Concealed runners (Tandem)' },
  { id: 'blum', name: 'Metal drawer box (Blum)' },
]

export function findDecor(id: string): Decor | undefined {
  return DECORS.find((decor) => decor.id === id)
}
