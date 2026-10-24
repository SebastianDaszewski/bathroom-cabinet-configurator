import { useEffect, useMemo, type ReactNode } from 'react'
import { ExtrudeGeometry, Matrix4, Path, Shape, Vector2 } from 'three'
import type { PanelMesh, PanelPart } from './panelShape'
import { decorTexture, TEXTURE_SIZE_MM } from './textures'

const HOLE_SEGMENTS = 16
const EDGE_ROUNDING = 1

const ROUNDED = {
  bevelEnabled: true,
  bevelThickness: EDGE_ROUNDING,
  bevelSize: EDGE_ROUNDING,
  bevelOffset: -EDGE_ROUNDING,
  bevelSegments: 2,
  curveSegments: HOLE_SEGMENTS,
}

const SECTION_TO_PANEL = new Matrix4().set(0, 0, -1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1)

function slab({ outline, from, to }: Extract<PanelPart, { kind: 'slab' }>): ExtrudeGeometry {
  const shape = new Shape(outline.points.map(([u, v]) => new Vector2(u, v)))
  for (const hole of outline.holes) {
    const path = new Path()
    path.absarc(hole.u, hole.v, hole.radius, 0, Math.PI * 2, true)
    shape.holes.push(path)
  }
  const geometry = new ExtrudeGeometry(shape, { ...ROUNDED, depth: to - from - 2 * EDGE_ROUNDING })
  geometry.translate(0, 0, from + EDGE_ROUNDING)
  return geometry
}

function projectUvs(geometry: ExtrudeGeometry) {
  const position = geometry.getAttribute('position')
  const normal = geometry.getAttribute('normal')
  const uv = geometry.getAttribute('uv')
  for (let index = 0; index < position.count; index++) {
    const [u, v, t] = [position.getX(index), position.getY(index), position.getZ(index)]
    const [nu, nv, nt] = [normal.getX(index), normal.getY(index), normal.getZ(index)].map(Math.abs)
    if (nt >= nu && nt >= nv) uv.setXY(index, u, v)
    else if (nv >= nu) uv.setXY(index, u, t)
    else uv.setXY(index, t, v)
  }
  uv.needsUpdate = true
}

function section({ section: points, length }: Extract<PanelPart, { kind: 'section' }>) {
  const shape = new Shape(points.map(([t, v]) => new Vector2(t, v)))
  const geometry = new ExtrudeGeometry(shape, { ...ROUNDED, depth: length - 2 * EDGE_ROUNDING })
  geometry.translate(0, 0, -length + EDGE_ROUNDING)
  geometry.applyMatrix4(SECTION_TO_PANEL)
  projectUvs(geometry)
  return geometry
}

function extrude(part: PanelPart): ExtrudeGeometry {
  return part.kind === 'slab' ? slab(part) : section(part)
}

function PartMesh({ part, material }: { part: PanelPart; material: ReactNode }) {
  const geometry = useMemo(() => extrude(part), [part])

  useEffect(() => () => geometry.dispose(), [geometry])

  return <mesh geometry={geometry}>{material}</mesh>
}

function PanelMeshView({ mesh }: { mesh: PanelMesh }) {
  const matrix = useMemo(() => new Matrix4().fromArray(mesh.matrix), [mesh.matrix])
  const texture = useMemo(() => {
    const map = decorTexture(mesh.finish, mesh.grainAxis).clone()
    map.repeat.set(1 / TEXTURE_SIZE_MM, 1 / TEXTURE_SIZE_MM)
    map.offset.set(mesh.textureOffset[0] / TEXTURE_SIZE_MM, mesh.textureOffset[1] / TEXTURE_SIZE_MM)
    return map
  }, [mesh.finish, mesh.grainAxis, mesh.textureOffset])

  useEffect(() => () => texture.dispose(), [texture])

  const material = (
    <meshStandardMaterial
      color={mesh.color}
      map={texture}
      roughness={mesh.finish === 'wood' ? 0.65 : 0.8}
    />
  )

  return (
    <group matrix={matrix} matrixAutoUpdate={false}>
      {mesh.parts.map((part, index) => (
        <PartMesh key={index} part={part} material={material} />
      ))}
    </group>
  )
}

export function PanelMeshes({ meshes }: { meshes: readonly PanelMesh[] }) {
  return (
    <>
      {meshes.map((mesh) => (
        <PanelMeshView key={mesh.id} mesh={mesh} />
      ))}
    </>
  )
}
