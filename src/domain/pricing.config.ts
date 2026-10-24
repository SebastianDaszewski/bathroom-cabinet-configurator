import type { BoardType, HandleFinish, HandleStyle, RunnerType } from './schema'

export const PRICING = {
  boardPerM2: {
    chipboard: 110,
    acrylic: 240,
    mdf: 190,
    perfectsense: 280,
  } satisfies Record<BoardType, number>,
  drawerBoardPerM2: 100,
  edgingPerM: 4,
  runnerPair: { tandem: 150, blum: 180 } satisfies Record<RunnerType, number>,
  tipOnUnit: 65,
  handle: { bar: 35, bow: 39, square: 45 } satisfies Record<HandleStyle, number>,
  handleFinish: { steel: 0, black: 4, gold: 9 } satisfies Record<HandleFinish, number>,
  edgeHandleProfilePerM: 45,
  edgeHandleFinishPerM: { steel: 0, black: 6, gold: 12 } satisfies Record<HandleFinish, number>,
  siphonCut: 29.5,
  hole: 2,
  gripGroovePerM: 25,
  labourBase: 264,
  labourPerPanel: 8,
  margin: 1.3,
} as const
