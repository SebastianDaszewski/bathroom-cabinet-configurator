import { useEffect, useMemo } from 'react'
import { ExtrudeGeometry, Matrix4, Path, Shape, Vector2 } from 'three'
import type { PanelMesh, PanelOutline } from './panelShape'
import { decorTexture, TEXTURE_SIZE_MM } from './textures'

const HOLE_SEGMENTS = 16
const EDGE_ROUNDING = 1

function extrude(outline: PanelOutline, thickness: number): ExtrudeGeometry {
  const shape = new Shape(outline.points.map(([u, v]) => new Vector2(u, v)))
  for (const hole of outline.holes) {
    const path = new Path()
    path.absarc(hole.u, hole.v, hole.radius, 0, Math.PI * 2, true)
    shape.holes.push(path)
  }
  const geometry = new ExtrudeGeometry(shape, {
    depth: thickness - 2 * EDGE_ROUNDING,
    bevelEnabled: true,
    bevelThickness: EDGE_ROUNDING,
    bevelSize: EDGE_ROUNDING,
    bevelOffset: -EDGE_ROUNDING,
    bevelSegments: 2,
    curveSegments: HOLE_SEGMENTS,
  })
  geometry.translate(0, 0, EDGE_ROUNDING)
  return geometry
}

function PanelMeshView({ mesh }: { mesh: PanelMesh }) {
  const geometry = useMemo(
    () => extrude(mesh.outline, mesh.thickness),
    [mesh.outline, mesh.thickness],
  )
  const matrix = useMemo(() => new Matrix4().fromArray(mesh.matrix), [mesh.matrix])
  const texture = useMemo(() => {
    const map = decorTexture(mesh.finish, mesh.grainAxis).clone()
    map.repeat.set(1 / TEXTURE_SIZE_MM, 1 / TEXTURE_SIZE_MM)
    map.offset.set(mesh.textureOffset[0] / TEXTURE_SIZE_MM, mesh.textureOffset[1] / TEXTURE_SIZE_MM)
    map.needsUpdate = true
    return map
  }, [mesh.finish, mesh.grainAxis, mesh.textureOffset])

  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => texture.dispose(), [texture])

  return (
    <mesh geometry={geometry} matrix={matrix} matrixAutoUpdate={false}>
      <meshStandardMaterial
        color={mesh.color}
        map={texture}
        roughness={mesh.finish === 'wood' ? 0.65 : 0.8}
      />
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
