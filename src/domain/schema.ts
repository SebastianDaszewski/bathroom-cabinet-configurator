import { z } from 'zod'

export const LIMITS = {
  width: { min: 500, max: 1200, step: 1 },
  height: { min: 400, max: 600, step: 1 },
  depth: { min: 390, max: 700, step: 1 },
  siphonOffset: { min: 200, max: 236, step: 1 },
  edgeHandleThickness: { min: 1, max: 4, step: 1 },
  handleSpacing: { min: 32, max: 480, step: 32 },
} as const

export type LimitedField = keyof typeof LIMITS

export const BOARD_TYPES = ['chipboard', 'acrylic', 'mdf', 'perfectsense'] as const
export const CARCASS_BOARD_TYPES = ['chipboard', 'acrylic', 'mdf'] as const
export const RUNNER_TYPES = ['tandem', 'blum'] as const
export const OPENING_TYPES = ['blumotion', 'tip-on'] as const
export const DRAWER_LENGTHS = [350, 400, 450] as const
export const SIPHON_POSITIONS = ['center', 'custom'] as const
export const FRONT_TYPES = ['standard', 'grip-groove', 'edge-handle'] as const
export const HANDLE_DRILLINGS = ['none', 'single', 'double'] as const
export const HANDLE_POSITIONS = ['top-50', 'center'] as const
export const DRAWER_IDS = ['top', 'bottom'] as const

export type BoardType = (typeof BOARD_TYPES)[number]
export type RunnerType = (typeof RUNNER_TYPES)[number]
export type DrawerLength = (typeof DRAWER_LENGTHS)[number]
export type DrawerId = (typeof DRAWER_IDS)[number]

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

  runner: z.enum(RUNNER_TYPES),
  opening: z.enum(OPENING_TYPES),
  drawers: z.object({ top: DrawerSchema, bottom: DrawerSchema }),
  siphonPosition: z.enum(SIPHON_POSITIONS),
  siphonOffset: z.number(),
  drawerDecor: z.string(),

  frontBoard: z.enum(BOARD_TYPES),
  frontDecor: z.string(),
  frontType: z.enum(FRONT_TYPES),
  edgeHandleThickness: z.number(),

  handleDrilling: z.enum(HANDLE_DRILLINGS),
  handleSpacing: z.number(),
  handlePosition: z.enum(HANDLE_POSITIONS),
})

export type Config = z.infer<typeof ConfigSchema>
export type DrawerConfig = Config['drawers'][DrawerId]

export const DEFAULT_CONFIG: Config = {
  width: 600,
  height: 500,
  depth: 500,
  carcassBoard: 'chipboard',
  carcassDecor: 'grey-u732',

  runner: 'blum',
  opening: 'blumotion',
  drawers: {
    top: { length: 450, siphonCut: true },
    bottom: { length: 450, siphonCut: false },
  },
  siphonPosition: 'center',
  siphonOffset: 218,
  drawerDecor: 'white-w960',

  frontBoard: 'chipboard',
  frontDecor: 'oak-h1145',
  frontType: 'standard',
  edgeHandleThickness: 2,

  handleDrilling: 'none',
  handleSpacing: 128,
  handlePosition: 'center',
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
