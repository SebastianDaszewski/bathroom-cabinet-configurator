import { Canvas } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Panel } from '../domain/panels'
import { DRAWER_IDS, type Config } from '../domain/schema'
import { downloadDataUrl } from '../ui/download'
import { CameraRig } from './CameraRig'
import { DimensionLabels, DimensionLines, LabelProjector } from './DimensionGuides'
import { DrawerGroup } from './DrawerGroup'
import {
  cabinetFloor,
  cabinetSpan,
  CAMERA_FOV,
  CAMERA_VIEWS,
  cameraDistance,
  cameraPosition,
  dimensionGuides,
  type CameraView,
} from './geometry'
import {
  CLOSED_DRAWERS,
  drawerOffsets,
  hardwareItems,
  toggleAllDrawers,
  type OpenDrawers,
} from './hardware'
import { HardwareMeshes } from './HardwareMeshes'
import { PanelMeshes } from './PanelMeshes'
import { panelMeshes } from './panelShape'
import { SnapshotBridge, type Snapshot } from './SnapshotBridge'
import { drawLabels, visibleLabels } from './snapshotLabels'
import { StudioLighting } from './StudioLighting'

const VIEW_LABELS: Record<CameraView, string> = {
  perspective: '3D',
  front: 'Przód',
  side: 'Bok',
  top: 'Góra',
}

const SNAPSHOT_BACKGROUND = '#eef0ee'

function shadowKey(config: Config): string {
  return [
    config.width,
    config.height,
    config.depth,
    config.topExtensionLeft,
    config.topExtensionRight,
    config.topExtensionFront,
    config.topThickening,
  ].join('-')
}

interface CabinetSceneProps {
  config: Config
  panels: readonly Panel[]
}

export default function CabinetScene({ config, panels }: CabinetSceneProps) {
  const [cameraKey, setCameraKey] = useState(0)
  const [view, setView] = useState<CameraView>('perspective')
  const [open, setOpen] = useState<OpenDrawers>(CLOSED_DRAWERS)
  const [fullscreen, setFullscreen] = useState(false)
  const container = useRef<HTMLDivElement>(null)
  const snapshot = useRef<Snapshot | null>(null)
  const [snapshotReady, setSnapshotReady] = useState(false)
  const anyOpen = DRAWER_IDS.some((id) => open[id])
  const meshes = useMemo(() => panelMeshes(config, panels), [config, panels])
  const hardware = useMemo(() => hardwareItems(config, panels), [config, panels])
  const guides = useMemo(() => dimensionGuides(config), [config])
  const offsets = drawerOffsets(config, open)
  const distance = cameraDistance(config)
  const labels = useRef(new Map<string, HTMLElement>())

  const registerSnapshot = useCallback((next: Snapshot | null) => {
    snapshot.current = next
    setSnapshotReady(next !== null)
  }, [])

  useEffect(() => {
    const sync = () => setFullscreen(document.fullscreenElement === container.current)
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])

  const showView = (next: CameraView) => {
    setView(next)
    setCameraKey((key) => key + 1)
  }

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void container.current?.requestFullscreen()
  }

  const savePicture = () => {
    const canvas = snapshot.current?.(SNAPSHOT_BACKGROUND)
    const scene = container.current
    if (!canvas || !scene) return
    const context = canvas.getContext('2d')
    if (context) {
      const scale = canvas.width / scene.clientWidth
      drawLabels(
        context,
        visibleLabels(labels.current.values(), scene.getBoundingClientRect()),
        scale,
      )
    }
    downloadDataUrl(
      `szafka-${config.width}x${config.height}x${config.depth}.png`,
      canvas.toDataURL('image/png'),
    )
  }

  return (
    <div className="scene" ref={container}>
      <Canvas
        frameloop="demand"
        dpr={[1, 2]}
        camera={{ position: cameraPosition(distance), fov: CAMERA_FOV, near: 0.01, far: 50 }}
      >
        <StudioLighting
          floor={cabinetFloor(config)}
          span={cabinetSpan(config)}
          shadowKey={shadowKey(config)}
        />
        <PanelMeshes meshes={meshes.filter((mesh) => mesh.drawer === null)} />
        {DRAWER_IDS.map((id) => (
          <DrawerGroup
            key={id}
            offset={offsets[id]}
            onToggle={() => setOpen((value) => ({ ...value, [id]: !value[id] }))}
          >
            <PanelMeshes meshes={meshes.filter((mesh) => mesh.drawer === id)} />
            <HardwareMeshes items={hardware.filter((item) => item.drawer === id)} />
          </DrawerGroup>
        ))}
        <DimensionLines guides={guides} />
        <LabelProjector guides={guides} labels={labels} />
        <CameraRig key={cameraKey} distance={distance} view={view} />
        <SnapshotBridge onReady={registerSnapshot} />
      </Canvas>
      <DimensionLabels guides={guides} labels={labels} />

      <div className="scene-actions">
        <button
          type="button"
          className="scene-button"
          aria-pressed={anyOpen}
          onClick={() => setOpen(toggleAllDrawers)}
        >
          {anyOpen ? 'Zamknij szuflady' : 'Otwórz szuflady'}
        </button>
        <button type="button" className="scene-button" onClick={() => showView('perspective')}>
          Przywróć widok
        </button>
      </div>

      <div className="scene-views" role="group" aria-label="Ujęcie kamery">
        {CAMERA_VIEWS.map((candidate) => (
          <button
            key={candidate}
            type="button"
            className="scene-button"
            aria-pressed={view === candidate}
            onClick={() => showView(candidate)}
          >
            {VIEW_LABELS[candidate]}
          </button>
        ))}
      </div>

      <div className="scene-tools">
        <button
          type="button"
          className="scene-button"
          disabled={!snapshotReady}
          onClick={savePicture}
        >
          Zapisz zdjęcie
        </button>
        <button
          type="button"
          className="scene-button"
          aria-pressed={fullscreen}
          onClick={toggleFullscreen}
        >
          {fullscreen ? 'Zamknij pełny ekran' : 'Pełny ekran'}
        </button>
      </div>
    </div>
  )
}
