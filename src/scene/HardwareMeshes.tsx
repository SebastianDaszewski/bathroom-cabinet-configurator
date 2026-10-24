import { useEffect, useMemo, type ReactNode } from 'react'
import {
  ExtrudeGeometry,
  QuadraticBezierCurve3,
  Shape,
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three'
import type { HardwareItem } from './hardware'
import type { Point } from './panelShape'

const CYLINDER_SEGMENTS = 24
const ROTATIONS = {
  x: [0, 0, Math.PI / 2],
  z: [Math.PI / 2, 0, 0],
} as const
const LAY_FLAT = [-Math.PI / 2, 0, 0] as const
const ALONG_X = [0, -Math.PI / 2, 0] as const
const TUBE_SEGMENTS = 32
const TUBE_SIDES = 12

type TrayItem = Extract<HardwareItem, { shape: 'tray' }>
type TubeItem = Extract<HardwareItem, { shape: 'tube' }>
type ProfileItem = Extract<HardwareItem, { shape: 'profile' }>

function TubeMesh({ item, material }: { item: TubeItem; material: ReactNode }) {
  const geometry = useMemo(() => {
    const [start, control, end] = item.points.map((point) => new Vector3(...point))
    const curve = new QuadraticBezierCurve3(start, control, end)
    return new TubeGeometry(curve, TUBE_SEGMENTS, item.radius, TUBE_SIDES, false)
  }, [item.points, item.radius])

  useEffect(() => () => geometry.dispose(), [geometry])

  return <mesh geometry={geometry}>{material}</mesh>
}

function ProfileMesh({ item, material }: { item: ProfileItem; material: ReactNode }) {
  const geometry = useMemo(() => {
    const shape = new Shape(item.section.map(([t, v]) => new Vector2(t, v)))
    return new ExtrudeGeometry(shape, { depth: item.length, bevelEnabled: false })
  }, [item.section, item.length])

  useEffect(() => () => geometry.dispose(), [geometry])

  const [x, y, z] = item.origin
  return (
    <mesh geometry={geometry} position={[x + item.length, y, z]} rotation={ALONG_X}>
      {material}
    </mesh>
  )
}

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
  if (item.shape === 'tube') return <TubeMesh item={item} material={material} />
  if (item.shape === 'profile') return <ProfileMesh item={item} material={material} />

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
