import { OrbitControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect, useRef, type ComponentRef } from 'react'
import { Vector3 } from 'three'
import { cameraPosition } from './geometry'

export function CameraRig({ distance }: { distance: number }) {
  const camera = useThree((state) => state.camera)
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null)
  const placed = useRef(false)

  useEffect(() => {
    const target = controls.current?.target ?? new Vector3()
    if (placed.current) {
      const direction = camera.position.clone().sub(target).normalize()
      camera.position.copy(target).add(direction.multiplyScalar(distance))
    } else {
      target.set(0, 0, 0)
      camera.position.set(...cameraPosition(distance))
      placed.current = true
    }
    controls.current?.update()
  }, [camera, distance])

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      minDistance={distance * 0.4}
      maxDistance={distance * 2.5}
    />
  )
}
