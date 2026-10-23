import { Canvas } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import type { Panel } from '../domain/panels'
import { DRAWER_IDS, type Config } from '../domain/schema'
import { CameraRig } from './CameraRig'
import { DimensionLabels, DimensionLines, LabelProjector } from './DimensionGuides'
import { DrawerGroup } from './DrawerGroup'
import { CAMERA_FOV, cameraDistance, cameraPosition, dimensionGuides } from './geometry'
import { drawerOffsets, hardwareItems } from './hardware'
import { HardwareMeshes } from './HardwareMeshes'
import { PanelMeshes } from './PanelMeshes'
import { panelMeshes } from './panelShape'

interface CabinetSceneProps {
  config: Config
  panels: readonly Panel[]
}

export default function CabinetScene({ config, panels }: CabinetSceneProps) {
  const [cameraKey, setCameraKey] = useState(0)
  const [open, setOpen] = useState(false)
  const meshes = useMemo(() => panelMeshes(config, panels), [config, panels])
  const hardware = useMemo(() => hardwareItems(config, panels), [config, panels])
  const guides = useMemo(() => dimensionGuides(config), [config])
  const offsets = drawerOffsets(config, open)
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
        <PanelMeshes meshes={meshes.filter((mesh) => mesh.drawer === null)} />
        {DRAWER_IDS.map((id) => (
          <DrawerGroup key={id} offset={offsets[id]}>
            <PanelMeshes meshes={meshes.filter((mesh) => mesh.drawer === id)} />
            <HardwareMeshes items={hardware.filter((item) => item.drawer === id)} />
          </DrawerGroup>
        ))}
        <DimensionLines guides={guides} />
        <LabelProjector guides={guides} labels={labels} />
        <CameraRig key={cameraKey} distance={distance} />
      </Canvas>
      <DimensionLabels guides={guides} labels={labels} />
      <div className="scene-actions">
        <button
          type="button"
          className="scene-button"
          aria-pressed={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? 'Zamknij szuflady' : 'Otwórz szuflady'}
        </button>
        <button
          type="button"
          className="scene-button"
          onClick={() => setCameraKey((key) => key + 1)}
        >
          Przywróć widok
        </button>
      </div>
    </div>
  )
}
