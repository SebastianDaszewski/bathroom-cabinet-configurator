import type { BoardType, RunnerType } from './schema'

export interface Board {
  id: BoardType
  name: string
}

export interface Decor {
  id: string
  name: string
  code: string
  color: string
  texture?: string
  boards: readonly BoardType[]
  pricePerM2Modifier: number
}

export interface Runner {
  id: RunnerType
  name: string
  woodenSides: boolean
  sideClearance: number
  bottomDeduction: number
  backDeduction: number
}

export const BOARDS: readonly Board[] = [
  { id: 'chipboard', name: 'Płyta laminowana' },
  { id: 'acrylic', name: 'Akryl wysoki połysk' },
  { id: 'mdf', name: 'MDF lakierowany' },
  { id: 'perfectsense', name: 'PerfectSense mat' },
]

export const DRAWER_BOARD: BoardType = 'chipboard'

export const DECORS: readonly Decor[] = [
  {
    id: 'white-w960',
    name: 'Biały klasyczny',
    code: 'W960',
    color: '#f2f1ec',
    boards: ['chipboard', 'acrylic', 'mdf'],
    pricePerM2Modifier: 1,
  },
  {
    id: 'grey-u732',
    name: 'Szary pyłowy',
    code: 'U732',
    color: '#8d8f8c',
    boards: ['chipboard', 'acrylic', 'mdf'],
    pricePerM2Modifier: 1,
  },
  {
    id: 'graphite-u961',
    name: 'Grafit',
    code: 'U961',
    color: '#3d3f41',
    boards: ['chipboard', 'mdf'],
    pricePerM2Modifier: 1.05,
  },
  {
    id: 'oak-h1145',
    name: 'Dąb naturalny',
    code: 'H1145',
    color: '#b8915f',
    boards: ['chipboard'],
    pricePerM2Modifier: 1.15,
  },
  {
    id: 'walnut-h3734',
    name: 'Orzech',
    code: 'H3734',
    color: '#7b5a3e',
    boards: ['chipboard'],
    pricePerM2Modifier: 1.2,
  },
  {
    id: 'concrete-f186',
    name: 'Jasny beton',
    code: 'F186',
    color: '#a7a6a1',
    boards: ['chipboard'],
    pricePerM2Modifier: 1.1,
  },
  {
    id: 'black-ps01',
    name: 'Czarny mat',
    code: 'PS01',
    color: '#1f1f1f',
    boards: ['perfectsense'],
    pricePerM2Modifier: 1,
  },
  {
    id: 'greige-ps02',
    name: 'Greige mat',
    code: 'PS02',
    color: '#b5aca1',
    boards: ['perfectsense'],
    pricePerM2Modifier: 1,
  },
]

export const RUNNERS: readonly Runner[] = [
  {
    id: 'tandem',
    name: 'Prowadnice ukryte (Tandem)',
    woodenSides: true,
    sideClearance: 5,
    bottomDeduction: 42,
    backDeduction: 42,
  },
  {
    id: 'blum',
    name: 'Szuflada metalowa (Blum)',
    woodenSides: false,
    sideClearance: 0,
    bottomDeduction: 75,
    backDeduction: 87,
  },
]

export function findBoard(id: BoardType): Board {
  return BOARDS.find((board) => board.id === id) ?? BOARDS[0]
}

export function findRunner(id: RunnerType): Runner {
  return RUNNERS.find((runner) => runner.id === id) ?? RUNNERS[0]
}

export function findDecor(id: string): Decor | undefined {
  return DECORS.find((decor) => decor.id === id)
}
