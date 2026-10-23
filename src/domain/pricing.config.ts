import type { BoardType, RunnerType } from './schema'

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
  handle: 35,
  edgeHandleProfilePerM: 45,
  siphonCut: 29.5,
  hole: 2,
  gripGroovePerM: 25,
  labourBase: 264,
  labourPerPanel: 8,
  margin: 1.3,
} as const
