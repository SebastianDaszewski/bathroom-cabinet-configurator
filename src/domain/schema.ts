import { z } from 'zod'

export const LIMITS = {
  width: { min: 500, max: 1200, step: 1 },
  height: { min: 400, max: 600, step: 1 },
  depth: { min: 390, max: 700, step: 1 },
  edgeHandleThickness: { min: 1, max: 4, step: 1 },
  gripHeight: { min: 25, max: 60, step: 1 },
  handleSpacing: { min: 32, max: 480, step: 32 },
  siphonCutWidth: { min: 120, max: 300, step: 1 },
  siphonCutDepth: { min: 150, max: 350, step: 1 },
  topExtensionLeft: { min: 0, max: 1800, step: 1 },
  topExtensionRight: { min: 0, max: 1800, step: 1 },
  topExtensionFront: { min: 0, max: 100, step: 1 },
} as const

export type LimitedField = keyof typeof LIMITS

export const BOARD_TYPES = ['chipboard', 'acrylic', 'mdf', 'perfectsense'] as const
export const CARCASS_BOARD_TYPES = ['chipboard', 'acrylic', 'mdf'] as const
const RUNNER_TYPES = ['tandem', 'blum'] as const
export const OPENING_TYPES = ['blumotion', 'tip-on'] as const
export const DRAWER_LENGTHS = [350, 400, 450] as const
export const SIPHON_POSITIONS = ['center', 'custom'] as const
export const FRONT_TYPES = ['standard', 'grip-groove', 'edge-handle', 'edge-handle-ready'] as const
export const SIDE_GRAINS = ['vertical', 'horizontal'] as const
export const FRONT_GRAINS = ['horizontal', 'vertical'] as const
export const EDGE_HANDLE_LENGTHS = ['full', '450', '300', '150'] as const
export const HANDLE_DRILLINGS = ['none', 'single', 'double'] as const
export const HANDLE_POSITIONS = ['top-50', 'center'] as const
const HANDLE_STYLES = ['bar', 'bow', 'square'] as const
const HANDLE_FINISHES = ['steel', 'black', 'gold'] as const
export const DRAWER_IDS = ['top', 'bottom'] as const
export const TOP_THICKENINGS = ['none', 'double'] as const

export type BoardType = (typeof BOARD_TYPES)[number]
export type RunnerType = (typeof RUNNER_TYPES)[number]
export type DrawerLength = (typeof DRAWER_LENGTHS)[number]
export type DrawerId = (typeof DRAWER_IDS)[number]
export type HandleStyle = (typeof HANDLE_STYLES)[number]
export type HandleFinish = (typeof HANDLE_FINISHES)[number]

const DrawerSchema = z.object({
  length: z.literal(DRAWER_LENGTHS),
  siphonCut: z.boolean(),
})

export const ConfigSchema = z.object({
  width: z.number(),
  height: z.number(),
  depth: z.number(),
  carcassBoard: z.enum(CARCASS_BOARD_TYPES),
  carcassDecor: z.string(),
  sideGrain: z.enum(SIDE_GRAINS),
  topThickening: z.enum(TOP_THICKENINGS),
  topExtensionLeft: z.number(),
  topExtensionRight: z.number(),
  topExtensionFront: z.number(),

  runner: z.enum(RUNNER_TYPES),
  opening: z.enum(OPENING_TYPES),
  drawers: z.object({ top: DrawerSchema, bottom: DrawerSchema }),
  siphonPosition: z.enum(SIPHON_POSITIONS),
  siphonCutWidth: z.number(),
  siphonCutDepth: z.number(),
  siphonX: z.number(),
  drawerDecor: z.string(),
  drawerBottomDecor: z.string(),

  frontBoard: z.enum(BOARD_TYPES),
  frontDecor: z.string(),
  frontGrain: z.enum(FRONT_GRAINS),
  continuousGrain: z.boolean(),
  frontType: z.enum(FRONT_TYPES),
  edgeHandleThickness: z.number(),
  edgeHandleLength: z.enum(EDGE_HANDLE_LENGTHS),
  gripHeight: z.number(),

  handleDrilling: z.enum(HANDLE_DRILLINGS),
  handleSpacing: z.number(),
  handlePosition: z.enum(HANDLE_POSITIONS),
  handleStyle: z.enum(HANDLE_STYLES),
  handleFinish: z.enum(HANDLE_FINISHES),
})

export type Config = z.infer<typeof ConfigSchema>
export type DrawerConfig = Config['drawers'][DrawerId]

export const DEFAULT_CONFIG: Config = {
  width: 600,
  height: 500,
  depth: 500,
  carcassBoard: 'chipboard',
  carcassDecor: 'grey-u732',
  sideGrain: 'vertical',
  topThickening: 'none',
  topExtensionLeft: 0,
  topExtensionRight: 0,
  topExtensionFront: 0,

  runner: 'blum',
  opening: 'blumotion',
  drawers: {
    top: { length: 450, siphonCut: false },
    bottom: { length: 450, siphonCut: false },
  },
  siphonPosition: 'center',
  siphonCutWidth: 164,
  siphonCutDepth: 270,
  siphonX: 300,
  drawerDecor: 'white-w960',
  drawerBottomDecor: 'white-w962',

  frontBoard: 'chipboard',
  frontDecor: 'oak-h1145',
  frontGrain: 'horizontal',
  continuousGrain: false,
  frontType: 'standard',
  edgeHandleThickness: 2,
  edgeHandleLength: 'full',
  gripHeight: 35,

  handleDrilling: 'none',
  handleSpacing: 128,
  handlePosition: 'center',
  handleStyle: 'bar',
  handleFinish: 'steel',
}

export function parseConfig(input: unknown): Config {
  const source: Record<string, unknown> =
    typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {}

  const entries = Object.entries(ConfigSchema.shape).map(([key, schema]) => {
    const result = schema.safeParse(source[key])
    return [key, result.success ? result.data : DEFAULT_CONFIG[key as keyof Config]]
  })

  return Object.fromEntries(entries) as Config
}
