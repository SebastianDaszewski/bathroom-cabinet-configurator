import { HANDLE_FINISH_SPECS, HANDLE_STYLE_SPECS } from '../../domain/catalog'
import { DOUBLE_HANDLE_MIN_WIDTH } from '../../domain/constants'
import {
  allowedHandleDrillings,
  allowedHandleSpacings,
  handleDrillingBlocker,
  hasEdgeHandle,
} from '../../domain/rules'
import {
  EDGE_HANDLE_LENGTHS,
  FRONT_TYPES,
  HANDLE_DRILLINGS,
  HANDLE_POSITIONS,
  LIMITS,
  type Config,
} from '../../domain/schema'
import { useConfigurator } from '../../state/useConfigurator'
import { ChoiceField } from '../../ui/ChoiceField'
import { NumberField } from '../../ui/NumberField'
import {
  EDGE_HANDLE_LENGTH_LABELS,
  FRONT_TYPE_DESCRIPTIONS,
  FRONT_TYPE_LABELS,
  HANDLE_DRILLING_DESCRIPTIONS,
  HANDLE_DRILLING_LABELS,
  HANDLE_FINISH_DESCRIPTIONS,
  HANDLE_POSITION_LABELS,
  HANDLE_STYLE_DESCRIPTIONS,
} from '../labels'
import { priceNote } from '../priceNotes'

function drillingHint(config: Config): string | null {
  if (config.width < DOUBLE_HANDLE_MIN_WIDTH) {
    return `Dwa uchwyty są dostępne od szerokości ${DOUBLE_HANDLE_MIN_WIDTH} mm.`
  }
  return null
}

function FinishField({ label, config }: { label: string; config: Config }) {
  const update = useConfigurator((state) => state.update)
  return (
    <ChoiceField
      label={label}
      value={config.handleFinish}
      options={HANDLE_FINISH_SPECS.map((finish) => ({
        value: finish.id,
        label: finish.name,
        note: priceNote(config, { handleFinish: finish.id }),
        description: HANDLE_FINISH_DESCRIPTIONS[finish.id],
      }))}
      onChange={(handleFinish) => update({ handleFinish })}
    />
  )
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
            note: priceNote(config, { frontType }),
            description: FRONT_TYPE_DESCRIPTIONS[frontType],
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
        {config.frontType === 'grip-groove' && (
          <NumberField
            label="Wysokość frezu"
            value={config.gripHeight}
            {...LIMITS.gripHeight}
            hint="Wysokość wybrania w licu nad wargą, w które wkładasz palce."
            onChange={(gripHeight) => update({ gripHeight })}
          />
        )}
        {config.frontType === 'edge-handle' && (
          <ChoiceField
            label="Długość profilu"
            value={config.edgeHandleLength}
            options={EDGE_HANDLE_LENGTHS.map((edgeHandleLength) => ({
              value: edgeHandleLength,
              label: EDGE_HANDLE_LENGTH_LABELS[edgeHandleLength],
              note: priceNote(config, { edgeHandleLength }),
            }))}
            hint="Krótszy profil jest wyśrodkowany na górnej krawędzi frontu."
            onChange={(edgeHandleLength) => update({ edgeHandleLength })}
          />
        )}
        {config.frontType === 'edge-handle' && (
          <FinishField label="Wykończenie profilu" config={config} />
        )}
      </section>

      {handleDrillingBlocker(config) === null && (
        <section className="step-group">
          <h3 className="step-group-title">Uchwyty</h3>
          <ChoiceField
            label="Nawiercenie"
            value={config.handleDrilling}
            options={HANDLE_DRILLINGS.map((drilling) => ({
              value: drilling,
              label: HANDLE_DRILLING_LABELS[drilling],
              disabled: !drillings.includes(drilling),
              note: drillings.includes(drilling)
                ? priceNote(config, { handleDrilling: drilling })
                : undefined,
              description: HANDLE_DRILLING_DESCRIPTIONS[drilling],
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
              <ChoiceField
                label="Wzór uchwytu"
                value={config.handleStyle}
                options={HANDLE_STYLE_SPECS.map((style) => ({
                  value: style.id,
                  label: style.name,
                  note: priceNote(config, { handleStyle: style.id }),
                  description: HANDLE_STYLE_DESCRIPTIONS[style.id],
                }))}
                onChange={(handleStyle) => update({ handleStyle })}
              />
            </>
          )}
          {config.handleDrilling !== 'none' && (
            <FinishField label="Wykończenie uchwytów" config={config} />
          )}
        </section>
      )}
    </>
  )
}
