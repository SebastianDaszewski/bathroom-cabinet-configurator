import { MAX_BOARD_LENGTH } from '../../domain/constants'
import { topDepth, topThickness } from '../../domain/panels'
import { allowedDrawerLengths, maxTopExtension, topLength } from '../../domain/rules'
import { LIMITS, TOP_THICKENINGS } from '../../domain/schema'
import { useConfigurator } from '../../state/useConfigurator'
import { ChoiceField } from '../../ui/ChoiceField'
import { NumberField } from '../../ui/NumberField'
import { TOP_THICKENING_DESCRIPTIONS, TOP_THICKENING_LABELS } from '../labels'
import { priceNote } from '../priceNotes'

export function DimensionsStep() {
  const config = useConfigurator((state) => state.config)
  const update = useConfigurator((state) => state.update)
  const longest = allowedDrawerLengths(config.depth).at(-1)

  return (
    <>
      <section className="step-group">
        <h3 className="step-group-title">Korpus</h3>
        <NumberField
          label="Szerokość"
          value={config.width}
          {...LIMITS.width}
          onChange={(width) => update({ width })}
        />
        <NumberField
          label="Wysokość"
          value={config.height}
          {...LIMITS.height}
          hint="Wysokość korpusu pod blatem, dzielona równo na dwa fronty szuflad."
          onChange={(height) => update({ height })}
        />
        <NumberField
          label="Głębokość"
          value={config.depth}
          {...LIMITS.depth}
          hint={`Przy tej głębokości szuflady mogą mieć do ${longest} mm długości.`}
          onChange={(depth) => update({ depth })}
        />
      </section>

      <section className="step-group">
        <h3 className="step-group-title">Blat</h3>
        <p className="field-hint step-group-note">
          {topLength(config)} × {topDepth(config)} mm, grubość {topThickness(config)} mm
        </p>
        <ChoiceField
          label="Grubość blatu"
          value={config.topThickening}
          options={TOP_THICKENINGS.map((thickening) => ({
            value: thickening,
            label: TOP_THICKENING_LABELS[thickening],
            note: priceNote(config, { topThickening: thickening }),
            description: TOP_THICKENING_DESCRIPTIONS[thickening],
          }))}
          onChange={(topThickening) => update({ topThickening })}
        />
        <NumberField
          label="Wydłużenie w lewo"
          value={config.topExtensionLeft}
          min={LIMITS.topExtensionLeft.min}
          max={maxTopExtension(config, 'topExtensionLeft')}
          onChange={(topExtensionLeft) => update({ topExtensionLeft })}
        />
        <NumberField
          label="Wydłużenie w prawo"
          value={config.topExtensionRight}
          min={LIMITS.topExtensionRight.min}
          max={maxTopExtension(config, 'topExtensionRight')}
          hint={`Blat może mieć najwyżej ${MAX_BOARD_LENGTH} mm długości, tyle ile arkusz płyty.`}
          onChange={(topExtensionRight) => update({ topExtensionRight })}
        />
        <NumberField
          label="Wydłużenie do przodu"
          value={config.topExtensionFront}
          {...LIMITS.topExtensionFront}
          onChange={(topExtensionFront) => update({ topExtensionFront })}
        />
      </section>
    </>
  )
}
