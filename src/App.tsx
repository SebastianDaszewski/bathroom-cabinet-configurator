import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'

export default function App() {
  return (
    <main className="app">
      <Canvas camera={{ position: [1.2, 0.9, 1.4], fov: 40 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 3, 2]} intensity={1.2} />
        <mesh>
          <boxGeometry args={[0.6, 0.5, 0.5]} />
          <meshStandardMaterial color="#c8a37a" />
        </mesh>
        <OrbitControls makeDefault />
      </Canvas>
    </main>
  )
}
