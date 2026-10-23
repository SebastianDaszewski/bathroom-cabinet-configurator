import { useFrame } from '@react-three/fiber'
import { useRef, useState, type ReactNode } from 'react'
import { MathUtils, type Group } from 'three'

const DAMPING = 10

function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

export function DrawerGroup({ offset, children }: { offset: number; children: ReactNode }) {
  const group = useRef<Group>(null)
  const [reducedMotion] = useState(prefersReducedMotion)

  useFrame((_, delta) => {
    const current = group.current
    if (!current) return
    current.position.z = reducedMotion
      ? offset
      : MathUtils.damp(current.position.z, offset, DAMPING, delta)
  })

  return <group ref={group}>{children}</group>
}
