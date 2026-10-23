import { Canvas } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import type { Panel } from '../domain/panels'
import type { Config } from '../domain/schema'
import { CameraRig } from './CameraRig'
import { DimensionLabels, DimensionLines, LabelProjector } from './DimensionGuides'
import {
  CAMERA_FOV,
  cameraDistance,
  cameraPosition,
  dimensionGuides,
  panelMeshes,
} from './geometry'
import { PanelMeshes } from './PanelMeshes'

interface CabinetSceneProps {
  config: Config
  panels: readonly Panel[]
}

export default function CabinetScene({ config, panels }: CabinetSceneProps) {
  const [cameraKey, setCameraKey] = useState(0)
  const meshes = useMemo(() => panelMeshes(config, panels), [config, panels])
  const guides = useMemo(() => dimensionGuides(config), [config])
  const distance = cameraDistance(config)
  const labels = useRef(new Map<string, HTMLElement>())

  return (
    <div className="scene">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: cameraPosition(distance), fov: CAMERA_FOV, near: 0.01, far: 50 }}
      >
        <hemisphereLight args={['#ffffff', '#d6d3d1', 1.2]} />
        <directionalLight position={[2, 3, 2]} intensity={1.4} />
        <directionalLight position={[-2, 1, -1]} intensity={0.4} />
        <PanelMeshes meshes={meshes} />
        <DimensionLines guides={guides} />
        <LabelProjector guides={guides} labels={labels} />
        <CameraRig key={cameraKey} distance={distance} />
      </Canvas>
      <DimensionLabels guides={guides} labels={labels} />
      <button type="button" className="scene-reset" onClick={() => setCameraKey((key) => key + 1)}>
        Reset view
      </button>
    </div>
  )
}
