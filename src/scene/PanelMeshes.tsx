import { Edges } from '@react-three/drei'
import type { PanelMesh } from './geometry'

const EDGE_COLOR = '#44403c'

export function PanelMeshes({ meshes }: { meshes: readonly PanelMesh[] }) {
  return (
    <group>
      {meshes.map((mesh) => (
        <mesh key={mesh.id} position={mesh.position}>
          <boxGeometry args={mesh.size} />
          <meshStandardMaterial color={mesh.color} roughness={0.7} />
          <Edges color={EDGE_COLOR} />
        </mesh>
      ))}
    </group>
  )
}
