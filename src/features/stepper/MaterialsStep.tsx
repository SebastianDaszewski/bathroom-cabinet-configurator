import { DRAWER_BOARD } from '../../domain/catalog'
import { compatibleDecors } from '../../domain/rules'
import { BOARD_TYPES, CARCASS_BOARD_TYPES } from '../../domain/schema'
import { useConfigurator } from '../../state/useConfigurator'
import { ChoiceField } from '../../ui/ChoiceField'
import { DecorPicker } from '../../ui/DecorPicker'
import { boardLabel } from '../labels'

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
      </section>

      <section className="step-group">
        <h3 className="step-group-title">Szuflady</h3>
        <DecorPicker
          label="Dekor wnętrza szuflad"
          value={config.drawerDecor}
          decors={compatibleDecors(DRAWER_BOARD)}
          onChange={(drawerDecor) => update({ drawerDecor })}
        />
      </section>
    </>
  )
}
