import { useEffect, useMemo, type ReactNode } from 'react'
import { ExtrudeGeometry, Shape, Vector2 } from 'three'
import type { HardwareItem } from './hardware'
import type { Point } from './panelShape'

const CYLINDER_SEGMENTS = 24
const ROTATIONS = {
  x: [0, 0, Math.PI / 2],
  z: [Math.PI / 2, 0, 0],
} as const
const LAY_FLAT = [-Math.PI / 2, 0, 0] as const

type TrayItem = Extract<HardwareItem, { shape: 'tray' }>

function extrudeFlat(points: Point[], depth: number): ExtrudeGeometry {
  const shape = new Shape(points.map(([u, v]) => new Vector2(u, -v)))
  return new ExtrudeGeometry(shape, { depth, bevelEnabled: false })
}

function TrayMesh({ item, material }: { item: TrayItem; material: ReactNode }) {
  const floor = useMemo(() => extrudeFlat(item.floor, item.wall), [item.floor, item.wall])
  const walls = useMemo(() => extrudeFlat(item.walls, item.height), [item.walls, item.height])

  useEffect(
    () => () => {
      floor.dispose()
      walls.dispose()
    },
    [floor, walls],
  )

  return (
    <group position={item.position} rotation={LAY_FLAT}>
      <mesh geometry={floor}>{material}</mesh>
      <mesh geometry={walls}>{material}</mesh>
    </group>
  )
}

function HardwareMesh({ item }: { item: HardwareItem }) {
  const material = (
    <meshStandardMaterial
      color={item.color}
      metalness={item.metal ? 0.6 : 0}
      roughness={item.metal ? 0.35 : 0.9}
    />
  )

  if (item.shape === 'tray') return <TrayMesh item={item} material={material} />

  if (item.shape === 'box') {
    return (
      <mesh position={item.position}>
        <boxGeometry args={item.size} />
        {material}
      </mesh>
    )
  }

  return (
    <mesh position={item.position} rotation={ROTATIONS[item.axis]}>
      <cylinderGeometry args={[item.radius, item.radius, item.length, CYLINDER_SEGMENTS]} />
      {material}
    </mesh>
  )
}

export function HardwareMeshes({ items }: { items: readonly HardwareItem[] }) {
  return (
    <>
      {items.map((item) => (
        <HardwareMesh key={item.id} item={item} />
      ))}
    </>
  )
}
