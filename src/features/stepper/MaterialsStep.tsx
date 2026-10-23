import { DRAWER_BOARD, isGrained } from '../../domain/catalog'
import { compatibleDecors } from '../../domain/rules'
import { BOARD_TYPES, CARCASS_BOARD_TYPES, FRONT_GRAINS, SIDE_GRAINS } from '../../domain/schema'
import { useConfigurator } from '../../state/useConfigurator'
import { ChoiceField } from '../../ui/ChoiceField'
import { DecorPicker } from '../../ui/DecorPicker'
import { Toggle } from '../../ui/Toggle'
import { boardLabel, FRONT_GRAIN_LABELS, SIDE_GRAIN_LABELS } from '../labels'

const boardChoices = <T extends string>(boards: readonly T[]) =>
  boards.map((board) => ({ value: board, label: boardLabel(board) }))

export function MaterialsStep() {
  const config = useConfigurator((state) => state.config)
  const update = useConfigurator((state) => state.update)

  return (
    <>
      <section className="step-group">
        <h3 className="step-group-title">Korpus</h3>
        <ChoiceField
          label="Materiał"
          value={config.carcassBoard}
          options={boardChoices(CARCASS_BOARD_TYPES)}
          onChange={(carcassBoard) => update({ carcassBoard })}
        />
        <DecorPicker
          label="Dekor"
          value={config.carcassDecor}
          decors={compatibleDecors(config.carcassBoard)}
          onChange={(carcassDecor) => update({ carcassDecor })}
        />
        {isGrained(config.carcassDecor) && (
          <ChoiceField
            label="Usłojenie boków"
            value={config.sideGrain}
            options={SIDE_GRAINS.map((grain) => ({
              value: grain,
              label: SIDE_GRAIN_LABELS[grain],
            }))}
            onChange={(sideGrain) => update({ sideGrain })}
          />
        )}
      </section>

      <section className="step-group">
        <h3 className="step-group-title">Fronty</h3>
        <ChoiceField
          label="Materiał"
          value={config.frontBoard}
          options={boardChoices(BOARD_TYPES)}
          onChange={(frontBoard) => update({ frontBoard })}
        />
        <DecorPicker
          label="Dekor"
          value={config.frontDecor}
          decors={compatibleDecors(config.frontBoard)}
          onChange={(frontDecor) => update({ frontDecor })}
        />
        {isGrained(config.frontDecor) && (
          <>
            <ChoiceField
              label="Usłojenie frontów"
              value={config.frontGrain}
              options={FRONT_GRAINS.map((grain) => ({
                value: grain,
                label: FRONT_GRAIN_LABELS[grain],
              }))}
              onChange={(frontGrain) => update({ frontGrain })}
            />
            {config.frontGrain === 'vertical' && (
              <Toggle
                label="Ciągłe usłojenie"
                checked={config.continuousGrain}
                hint="Oba fronty cięte z jednego pasa płyty, słoje przechodzą z frontu na front."
                onChange={(continuousGrain) => update({ continuousGrain })}
              />
            )}
          </>
        )}
      </section>

      <section className="step-group">
        <h3 className="step-group-title">Szuflady</h3>
        <DecorPicker
          label="Dekor wnętrza szuflad"
          value={config.drawerDecor}
          decors={compatibleDecors(DRAWER_BOARD)}
          onChange={(drawerDecor) => update({ drawerDecor })}
        />
        <DecorPicker
          label="Dekor dna szuflad"
          value={config.drawerBottomDecor}
          decors={compatibleDecors(DRAWER_BOARD)}
          onChange={(drawerBottomDecor) => update({ drawerBottomDecor })}
        />
      </section>
    </>
  )
}
