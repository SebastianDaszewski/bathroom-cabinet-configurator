import { Edges } from '@react-three/drei'
import { useEffect, useMemo } from 'react'
import { ExtrudeGeometry, Matrix4, Path, Shape, Vector2 } from 'three'
import type { PanelMesh, PanelOutline } from './panelShape'

const EDGE_COLOR = '#44403c'
const HOLE_SEGMENTS = 16

function extrude(outline: PanelOutline, thickness: number): ExtrudeGeometry {
  const shape = new Shape(outline.points.map(([u, v]) => new Vector2(u, v)))
  for (const hole of outline.holes) {
    const path = new Path()
    path.absarc(hole.u, hole.v, hole.radius, 0, Math.PI * 2, true)
    shape.holes.push(path)
  }
  return new ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
    curveSegments: HOLE_SEGMENTS,
  })
}

function PanelMeshView({ mesh }: { mesh: PanelMesh }) {
  const geometry = useMemo(
    () => extrude(mesh.outline, mesh.thickness),
    [mesh.outline, mesh.thickness],
  )
  const matrix = useMemo(() => new Matrix4().fromArray(mesh.matrix), [mesh.matrix])

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <mesh geometry={geometry} matrix={matrix} matrixAutoUpdate={false}>
      <meshStandardMaterial color={mesh.color} roughness={0.7} />
      <Edges color={EDGE_COLOR} />
    </mesh>
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
