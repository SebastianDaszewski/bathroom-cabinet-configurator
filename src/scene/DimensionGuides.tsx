import { Line } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import type { RefObject } from 'react'
import { Vector3 } from 'three'
import { ndcToScreen, type DimensionGuide } from './geometry'

const GUIDE_COLOR = '#57534e'

export function DimensionLines({ guides }: { guides: readonly DimensionGuide[] }) {
  return (
    <group>
      {guides.map((guide) => (
        <Line key={guide.id} points={[guide.from, guide.to]} color={GUIDE_COLOR} lineWidth={1} />
      ))}
    </group>
  )
}

interface LabelProjectorProps {
  guides: readonly DimensionGuide[]
  labels: RefObject<Map<string, HTMLElement>>
}

export function LabelProjector({ guides, labels }: LabelProjectorProps) {
  useFrame(({ camera, size }) => {
    const point = new Vector3()
    for (const guide of guides) {
      const label = labels.current.get(guide.id)
      if (!label) continue
      point.set(...guide.labelPosition).project(camera)
      const screen = ndcToScreen(point, size)
      label.style.visibility = screen.visible ? 'visible' : 'hidden'
      label.style.transform = `translate(${screen.x}px, ${screen.y}px) translate(-50%, -50%)`
    }
  })

  return null
}

interface DimensionLabelsProps {
  guides: readonly DimensionGuide[]
  labels: RefObject<Map<string, HTMLElement>>
}

export function DimensionLabels({ guides, labels }: DimensionLabelsProps) {
  return (
    <div className="dimension-labels" aria-hidden="true">
      {guides.map((guide) => (
        <span
          key={guide.id}
          className="dimension-label"
          ref={(element) => {
            if (element) labels.current.set(guide.id, element)
            else labels.current.delete(guide.id)
          }}
        >
          {guide.label}
        </span>
      ))}
    </div>
  )
}
