import { Edges } from '@react-three/drei'
import { useEffect, useMemo } from 'react'
import { BoxGeometry, EdgesGeometry, ExtrudeGeometry, Matrix4, Path, Shape, Vector2 } from 'three'
import type { GlueBlock, PanelMesh, PanelOutline } from './panelShape'

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
      {!mesh.glueGroup && <Edges color={EDGE_COLOR} />}
    </mesh>
  )
}

function GlueBlockOutline({ block }: { block: GlueBlock }) {
  const geometry = useMemo(() => {
    const box = new BoxGeometry(...block.size)
    const edges = new EdgesGeometry(box)
    box.dispose()
    return edges
  }, [block.size])

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <lineSegments geometry={geometry} position={block.position}>
      <lineBasicMaterial color={EDGE_COLOR} />
    </lineSegments>
  )
}

interface PanelMeshesProps {
  meshes: readonly PanelMesh[]
  blocks: readonly GlueBlock[]
}

export function PanelMeshes({ meshes, blocks }: PanelMeshesProps) {
  return (
    <>
      {meshes.map((mesh) => (
        <PanelMeshView key={mesh.id} mesh={mesh} />
      ))}
      {blocks.map((block) => (
        <GlueBlockOutline key={block.id} block={block} />
      ))}
    </>
  )
}
