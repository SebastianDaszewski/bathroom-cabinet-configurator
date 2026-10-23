import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'

export type Snapshot = (background: string) => HTMLCanvasElement

export function SnapshotBridge({ onReady }: { onReady: (snapshot: Snapshot | null) => void }) {
  const { gl, scene, camera } = useThree()

  useEffect(() => {
    onReady((background) => {
      gl.render(scene, camera)
      const source = gl.domElement
      const canvas = document.createElement('canvas')
      canvas.width = source.width
      canvas.height = source.height
      const context = canvas.getContext('2d')
      if (!context) return source
      context.fillStyle = background
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(source, 0, 0)
      return canvas
    })
    return () => onReady(null)
  }, [gl, scene, camera, onReady])

  return null
}
