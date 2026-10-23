import { DOUBLE_HANDLE_MIN_WIDTH } from '../../domain/constants'
import {
  allowedHandleDrillings,
  allowedHandleSpacings,
  handleDrillingBlocker,
  hasEdgeHandle,
} from '../../domain/rules'
import {
  FRONT_TYPES,
  HANDLE_DRILLINGS,
  HANDLE_POSITIONS,
  LIMITS,
  type Config,
} from '../../domain/schema'
import { useConfigurator } from '../../state/useConfigurator'
import { ChoiceField } from '../../ui/ChoiceField'
import { NumberField } from '../../ui/NumberField'
import { FRONT_TYPE_LABELS, HANDLE_DRILLING_LABELS, HANDLE_POSITION_LABELS } from '../labels'

function drillingHint(config: Config): string | null {
  const blocker = handleDrillingBlocker(config)
  if (blocker) return blocker
  if (config.width < DOUBLE_HANDLE_MIN_WIDTH) {
    return `Dwa uchwyty są dostępne od szerokości ${DOUBLE_HANDLE_MIN_WIDTH} mm.`
  }
  return null
}

export function FrontsStep() {
  const config = useConfigurator((state) => state.config)
  const update = useConfigurator((state) => state.update)

  const drillings = allowedHandleDrillings(config)
  const spacings = allowedHandleSpacings(config.width, config.handleDrilling)

  return (
    <>
      <section className="step-group">
        <h3 className="step-group-title">Front</h3>
        <ChoiceField
          label="Rodzaj frontu"
          value={config.frontType}
          options={FRONT_TYPES.map((frontType) => ({
            value: frontType,
            label: FRONT_TYPE_LABELS[frontType],
          }))}
          onChange={(frontType) => update({ frontType })}
        />
        {hasEdgeHandle(config) && (
          <NumberField
            label="Grubość profilu uchwytu"
            value={config.edgeHandleThickness}
            {...LIMITS.edgeHandleThickness}
            hint={
              config.frontType === 'edge-handle'
                ? 'Każdy front jest niższy o grubość profilu.'
                : 'Fronty są skrócone pod profil, ale sam profil nie jest w zestawie.'
            }
            onChange={(edgeHandleThickness) => update({ edgeHandleThickness })}
          />
        )}
      </section>

      <section className="step-group">
        <h3 className="step-group-title">Uchwyty</h3>
        <ChoiceField
          label="Nawiercenie"
          value={config.handleDrilling}
          options={HANDLE_DRILLINGS.map((drilling) => ({
            value: drilling,
            label: HANDLE_DRILLING_LABELS[drilling],
            disabled: !drillings.includes(drilling),
          }))}
          hint={drillingHint(config)}
          onChange={(handleDrilling) => update({ handleDrilling })}
        />
        {config.handleDrilling !== 'none' && (
          <>
            <NumberField
              label="Rozstaw otworów"
              value={config.handleSpacing}
              min={LIMITS.handleSpacing.min}
              max={spacings.at(-1) ?? LIMITS.handleSpacing.min}
              step={LIMITS.handleSpacing.step}
              hint="Rozstaw rośnie co 32 mm, zgodnie ze standardem uchwytów meblowych."
              onChange={(handleSpacing) => update({ handleSpacing })}
            />
            <ChoiceField
              label="Wysokość uchwytu na froncie"
              value={config.handlePosition}
              options={HANDLE_POSITIONS.map((position) => ({
                value: position,
                label: HANDLE_POSITION_LABELS[position],
              }))}
              onChange={(handlePosition) => update({ handlePosition })}
            />
          </>
        )}
      </section>
    </>
  )
}
