import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { MathUtils, type Group } from 'three'

const DAMPING = 4
const CLICK_TOLERANCE_PX = 4
const SETTLED = 0.0001

function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

interface DrawerGroupProps {
  offset: number
  onToggle: () => void
  children: ReactNode
}

export function DrawerGroup({ offset, onToggle, children }: DrawerGroupProps) {
  const group = useRef<Group>(null)
  const [reducedMotion] = useState(prefersReducedMotion)
  const [hovered, setHovered] = useState(false)
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => {
    invalidate()
  }, [offset, invalidate])

  useEffect(() => {
    if (!hovered) return
    document.body.style.cursor = 'pointer'
    return () => {
      document.body.style.cursor = ''
    }
  }, [hovered])

  useFrame((_, delta) => {
    const current = group.current
    if (!current) return
    const next = MathUtils.damp(current.position.z, offset, DAMPING, delta)
    const settled = reducedMotion || Math.abs(next - offset) < SETTLED
    current.position.z = settled ? offset : next
    if (!settled) invalidate()
  })

  const onClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    if (event.delta > CLICK_TOLERANCE_PX) return
    onToggle()
  }

  return (
    <group
      ref={group}
      onClick={onClick}
      onPointerOver={(event) => {
        event.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
    >
      {children}
    </group>
  )
}
