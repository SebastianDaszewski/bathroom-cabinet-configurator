import { RUNNERS } from '../../domain/catalog'
import { DRAWER_DEPTH_CLEARANCE } from '../../domain/constants'
import {
  allowedDrawerLengths,
  maxSiphonCutDepth,
  maxSiphonCutWidth,
  siphonXRange,
} from '../../domain/rules'
import {
  DRAWER_IDS,
  DRAWER_LENGTHS,
  LIMITS,
  OPENING_TYPES,
  SIPHON_POSITIONS,
  type DrawerId,
} from '../../domain/schema'
import { useConfigurator } from '../../state/useConfigurator'
import { ChoiceField } from '../../ui/ChoiceField'
import { NumberField } from '../../ui/NumberField'
import { Toggle } from '../../ui/Toggle'
import { OPENING_LABELS, SIPHON_POSITION_LABELS } from '../labels'

const DRAWER_NAMES: Record<DrawerId, string> = {
  top: 'Górna szuflada',
  bottom: 'Dolna szuflada',
}

export function DrawersStep() {
  const config = useConfigurator((state) => state.config)
  const update = useConfigurator((state) => state.update)
  const updateDrawer = useConfigurator((state) => state.updateDrawer)

  const allowed = allowedDrawerLengths(config.depth)
  const blocked = DRAWER_LENGTHS.filter((length) => !allowed.includes(length))
  const lengthHint =
    blocked.length > 0
      ? `Szuflada ${blocked[0]} mm wymaga głębokości min. ${blocked[0] + DRAWER_DEPTH_CLEARANCE} mm.`
      : null
  const hasSiphonCut = DRAWER_IDS.some((id) => config.drawers[id].siphonCut)
  const xRange = siphonXRange(config)

  return (
    <>
      <section className="step-group">
        <h3 className="step-group-title">Prowadnice</h3>
        <ChoiceField
          label="Typ"
          value={config.runner}
          options={RUNNERS.map((runner) => ({ value: runner.id, label: runner.name }))}
          onChange={(runner) => update({ runner })}
        />
        <ChoiceField
          label="Otwieranie"
          value={config.opening}
          options={OPENING_TYPES.map((opening) => ({
            value: opening,
            label: OPENING_LABELS[opening],
          }))}
          onChange={(opening) => update({ opening })}
        />
      </section>

      {DRAWER_IDS.map((id) => (
        <section className="step-group" key={id}>
          <h3 className="step-group-title">{DRAWER_NAMES[id]}</h3>
          <ChoiceField
            label="Długość"
            value={config.drawers[id].length}
            options={DRAWER_LENGTHS.map((length) => ({
              value: length,
              label: `${length} mm`,
              disabled: !allowed.includes(length),
            }))}
            hint={lengthHint}
            onChange={(length) => updateDrawer(id, { length })}
          />
          <Toggle
            label="Wycięcie pod syfon"
            hint="Osłona przy tylnej ściance, która ma przerwę na rurę."
            checked={config.drawers[id].siphonCut}
            onChange={(siphonCut) => updateDrawer(id, { siphonCut })}
          />
        </section>
      ))}

      {hasSiphonCut && (
        <section className="step-group">
          <h3 className="step-group-title">Wycięcie pod syfon</h3>
          <NumberField
            label="Szerokość wycięcia"
            value={config.siphonCutWidth}
            min={LIMITS.siphonCutWidth.min}
            max={maxSiphonCutWidth(config.width)}
            onChange={(siphonCutWidth) => update({ siphonCutWidth })}
          />
          <NumberField
            label="Długość wycięcia"
            value={config.siphonCutDepth}
            min={LIMITS.siphonCutDepth.min}
            max={maxSiphonCutDepth(config)}
            hint="Mierzona od tylnej ścianki szuflady w stronę frontu."
            onChange={(siphonCutDepth) => update({ siphonCutDepth })}
          />
          <ChoiceField
            label="Położenie"
            value={config.siphonPosition}
            options={SIPHON_POSITIONS.map((position) => ({
              value: position,
              label: SIPHON_POSITION_LABELS[position],
            }))}
            onChange={(siphonPosition) =>
              update({ siphonPosition, siphonX: Math.round(config.width / 2) })
            }
          />
          {config.siphonPosition === 'custom' && (
            <NumberField
              label="Środek wycięcia od lewego boku"
              value={config.siphonX}
              min={xRange.min}
              max={xRange.max}
              onChange={(siphonX) => update({ siphonX })}
            />
          )}
        </section>
      )}
    </>
  )
}
