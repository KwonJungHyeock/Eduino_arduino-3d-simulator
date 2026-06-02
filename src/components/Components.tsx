import { useState } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { useSimulatorStore } from '../store/useSimulatorStore'
import {
  COMPONENT_LIBRARY,
  componentPinId,
  type ComponentPin,
  type PlacedComponent,
} from '../domain/components'

/** A clickable connection pin shared by every component. */
function PinMarker({ pinId, pin }: { pinId: string; pin: ComponentPin }) {
  const [hovered, setHovered] = useState(false)
  const isPending = useSimulatorStore((s) => s.pendingPinId === pinId)
  const selectPin = useSimulatorStore((s) => s.selectPin)

  const active = hovered || isPending

  return (
    <group position={pin.offset}>
      <mesh
        scale={active ? 1.4 : 1}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation()
          selectPin(pinId)
        }}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'auto'
        }}
      >
        <cylinderGeometry args={[0.04, 0.04, 0.1, 14]} />
        <meshStandardMaterial
          color={isPending ? '#facc15' : '#e7c873'}
          emissive={isPending ? '#facc15' : '#000000'}
          emissiveIntensity={isPending ? 0.8 : 0}
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>
      <Text position={[0, 0.12, 0]} fontSize={0.06} color="#dbeafe" anchorX="center" anchorY="middle">
        {pin.label}
      </Text>
    </group>
  )
}

/** Render the physical body of a component by its type. */
function ComponentBody({ placed }: { placed: PlacedComponent }) {
  const isRunning = useSimulatorStore((s) => s.isRunning)
  const def = COMPONENT_LIBRARY[placed.type]

  switch (placed.type) {
    case 'led':
      return (
        <group>
          <mesh position={[0, 0.05, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.12, 0.06, 20]} />
            <meshStandardMaterial color="#9ca3af" metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.16, 0]} castShadow>
            <sphereGeometry args={[0.12, 20, 16]} />
            <meshStandardMaterial
              color={def.color}
              emissive={def.color}
              emissiveIntensity={isRunning ? 0.9 : 0.15}
              transparent
              opacity={0.85}
            />
          </mesh>
        </group>
      )
    case 'resistor':
      return (
        <group rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.09, 0.09, 0.4, 18]} />
            <meshStandardMaterial color={def.color} roughness={0.6} />
          </mesh>
          {[-0.08, 0, 0.08].map((y, i) => (
            <mesh key={i} position={[0, y, 0]}>
              <cylinderGeometry args={[0.095, 0.095, 0.02, 18]} />
              <meshStandardMaterial color={i === 1 ? '#b91c1c' : '#1f2937'} />
            </mesh>
          ))}
        </group>
      )
    case 'pushbutton':
      return (
        <group>
          <mesh position={[0, 0.06, 0]} castShadow>
            <boxGeometry args={[0.34, 0.12, 0.34]} />
            <meshStandardMaterial color={def.color} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.16, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.09, 0.06, 18]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.4} />
          </mesh>
        </group>
      )
    case 'potentiometer':
      return (
        <group>
          <mesh position={[0, 0.07, 0]} castShadow>
            <boxGeometry args={[0.4, 0.14, 0.34]} />
            <meshStandardMaterial color={def.color} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.22, -0.05]} castShadow>
            <cylinderGeometry args={[0.1, 0.1, 0.14, 20]} />
            <meshStandardMaterial color="#1e293b" roughness={0.4} />
          </mesh>
        </group>
      )
    default:
      return null
  }
}

function PlacedComponentView({ placed }: { placed: PlacedComponent }) {
  const def = COMPONENT_LIBRARY[placed.type]
  return (
    <group position={placed.position}>
      <ComponentBody placed={placed} />
      {def.pins.map((pin) => (
        <PinMarker
          key={pin.name}
          pinId={componentPinId(placed.id, pin.name)}
          pin={pin}
        />
      ))}
    </group>
  )
}

/** Renders every component placed in the workspace. */
export default function Components() {
  const components = useSimulatorStore((s) => s.components)
  return (
    <>
      {components.map((placed) => (
        <PlacedComponentView key={placed.id} placed={placed} />
      ))}
    </>
  )
}
