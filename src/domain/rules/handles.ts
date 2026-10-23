import { DOUBLE_HANDLE_MIN_WIDTH, HANDLE_EDGE_MARGIN } from '../constants'
import { HANDLE_DRILLINGS, LIMITS, type Config } from '../schema'
import { hasEdgeHandle } from './fronts'
import type { Rule } from './types'

type HandleDrilling = Config['handleDrilling']

export function handleDrillingBlocker(config: Config): string | null {
  if (config.opening === 'tip-on')
    return 'Fronty otwierane przez naciśnięcie (Tip-On) nie mają uchwytów.'
  if (hasEdgeHandle(config)) return 'Fronty z uchwytem krawędziowym nie mają nawierceń pod uchwyty.'
  if (config.frontType === 'grip-groove')
    return 'Fronty z frezowanym uchwytem nie mają nawierceń pod uchwyty.'
  return null
}

export function allowedHandleDrillings(config: Config): HandleDrilling[] {
  if (handleDrillingBlocker(config)) return ['none']
  return HANDLE_DRILLINGS.filter(
    (drilling) => drilling !== 'double' || config.width >= DOUBLE_HANDLE_MIN_WIDTH,
  )
}

export function maxHandleSpacing(width: number, drilling: HandleDrilling): number {
  const { min, max, step } = LIMITS.handleSpacing
  const widthPerHandle = drilling === 'double' ? width / 2 : width
  const limit = Math.min(max, widthPerHandle - 2 * HANDLE_EDGE_MARGIN)
  return Math.max(min, Math.floor(limit / step) * step)
}

export function allowedHandleSpacings(width: number, drilling: HandleDrilling): number[] {
  const { min, step } = LIMITS.handleSpacing
  const max = maxHandleSpacing(width, drilling)
  const spacings: number[] = []
  for (let spacing = min; spacing <= max; spacing += step) {
    spacings.push(spacing)
  }
  return spacings
}

export const applyHandleCompatibility: Rule = (config) => {
  const blocker = handleDrillingBlocker(config)
  if (!blocker || config.handleDrilling === 'none') return { config, adjustments: [] }

  return {
    config: { ...config, handleDrilling: 'none' },
    adjustments: [
      {
        rule: 'R4',
        field: 'handleDrilling',
        from: config.handleDrilling,
        to: 'none',
        reason: blocker,
      },
    ],
  }
}

export const applyDoubleHandleWidth: Rule = (config) => {
  if (config.handleDrilling !== 'double' || config.width >= DOUBLE_HANDLE_MIN_WIDTH) {
    return { config, adjustments: [] }
  }

  return {
    config: { ...config, handleDrilling: 'single' },
    adjustments: [
      {
        rule: 'R7',
        field: 'handleDrilling',
        from: 'double',
        to: 'single',
        reason: `Podwójne uchwyty wymagają szafki o szerokości min. ${DOUBLE_HANDLE_MIN_WIDTH} mm.`,
      },
    ],
  }
}

export const applyHandleSpacing: Rule = (config) => {
  const max = maxHandleSpacing(config.width, config.handleDrilling)
  if (config.handleSpacing <= max) return { config, adjustments: [] }

  return {
    config: { ...config, handleSpacing: max },
    adjustments: [
      {
        rule: 'R6',
        field: 'handleSpacing',
        from: config.handleSpacing,
        to: max,
        reason: `Uchwyt musi być min. ${HANDLE_EDGE_MARGIN} mm od krawędzi frontu, największy możliwy rozstaw to ${max} mm.`,
      },
    ],
  }
}
