import { allowedDrawerLengths } from '../../domain/rules'
import { LIMITS } from '../../domain/schema'
import { useConfigurator } from '../../state/useConfigurator'
import { NumberField } from '../../ui/NumberField'

export function DimensionsStep() {
  const config = useConfigurator((state) => state.config)
  const update = useConfigurator((state) => state.update)
  const longest = allowedDrawerLengths(config.depth).at(-1)

  return (
    <>
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
        hint="Wysokość dzielona jest równo na dwa fronty szuflad."
        onChange={(height) => update({ height })}
      />
      <NumberField
        label="Głębokość"
        value={config.depth}
        {...LIMITS.depth}
        hint={`Przy tej głębokości szuflady mogą mieć do ${longest} mm długości.`}
        onChange={(depth) => update({ depth })}
      />
    </>
  )
}
