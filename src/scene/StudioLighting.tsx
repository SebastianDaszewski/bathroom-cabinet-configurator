import { ContactShadows, Environment, Lightformer } from '@react-three/drei'

const SHADOW_GAP = 0.002

interface StudioLightingProps {
  floor: number
  span: number
  shadowKey: string
}

export function StudioLighting({ floor, span, shadowKey }: StudioLightingProps) {
  return (
    <>
      <Environment resolution={256}>
        <Lightformer intensity={2.2} position={[0, 4, 3]} scale={[8, 4, 1]} />
        <Lightformer
          intensity={1.2}
          rotation-x={Math.PI / 2}
          position={[0, 5, 0]}
          scale={[10, 10, 1]}
        />
        <Lightformer
          intensity={0.8}
          rotation-y={Math.PI / 2}
          position={[-6, 1, 0]}
          scale={[12, 3, 1]}
        />
        <Lightformer
          intensity={0.6}
          rotation-y={-Math.PI / 2}
          position={[6, 1, 0]}
          scale={[12, 3, 1]}
        />
      </Environment>
      <directionalLight position={[2, 3, 2.5]} intensity={0.9} />
      <ContactShadows
        key={shadowKey}
        frames={1}
        position={[0, floor - SHADOW_GAP, 0]}
        scale={span * 2.2}
        far={0.4}
        blur={2.6}
        opacity={0.35}
        resolution={512}
      />
    </>
  )
}
