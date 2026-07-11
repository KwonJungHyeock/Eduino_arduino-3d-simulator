import type { ThreeEvent } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { useSimulatorStore } from '../store/useSimulatorStore'
import { useDraggable } from '../three/useDraggable'
import { useSimulation } from '../hooks/useSimulation'
import { usePinConnect } from '../hooks/usePinConnect'
import {
  COMPONENT_LIBRARY,
  componentPinId,
  type ComponentPin,
  type PlacedComponent,
} from '../domain/components'

/* Pins handle wiring (drag or tap); the component body handles moving (drag). */

/** A connectable component pin — drag from it, or tap, to wire. */
function PinMarker({ pinId, pin }: { pinId: string; pin: ComponentPin }) {
  const isPending = useSimulatorStore((s) => s.pendingPinId === pinId)
  const { hovered, handlers } = usePinConnect(pinId)
  const active = hovered || isPending

  return (
    <group position={pin.offset}>
      {/* Enlarged invisible hit area for easy grabbing. */}
      <mesh {...handlers}>
        <sphereGeometry args={[0.11, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh scale={active ? 1.4 : 1}>
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
function ComponentBody({ placed, lit }: { placed: PlacedComponent; lit: boolean }) {
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
              emissiveIntensity={lit ? 1.6 : 0.12}
              toneMapped={false}
              transparent
              opacity={0.85}
            />
          </mesh>
          {/* Glow halo when the LED is lit. */}
          {lit && (
            <pointLight position={[0, 0.2, 0]} color={def.color} intensity={2} distance={1.5} />
          )}
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
      return <PushbuttonBody placed={placed} />

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

/** Interactive tactile pushbutton: press the cap (while running) to close it. */
function PushbuttonBody({ placed }: { placed: PlacedComponent }) {
  const isRunning = useSimulatorStore((s) => s.isRunning)
  const pressed = useSimulatorStore((s) =>
    s.pressedButtons.includes(placed.id),
  )
  const toggleButton = useSimulatorStore((s) => s.toggleButton)
  const def = COMPONENT_LIBRARY.pushbutton

  return (
    <group>
      <mesh position={[0, 0.06, 0]} castShadow>
        <boxGeometry args={[0.34, 0.12, 0.34]} />
        <meshStandardMaterial color={def.color} roughness={0.6} />
      </mesh>
      <mesh
        position={[0, pressed ? 0.13 : 0.16, 0]}
        castShadow
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation()
          if (isRunning) toggleButton(placed.id)
        }}
        onPointerDown={(e: ThreeEvent<PointerEvent>) => e.stopPropagation()}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        <cylinderGeometry args={[0.09, 0.09, 0.06, 18]} />
        <meshStandardMaterial
          color={pressed ? '#ef4444' : '#e2e8f0'}
          emissive={pressed ? '#7f1d1d' : '#000000'}
          emissiveIntensity={pressed ? 0.4 : 0}
          roughness={0.4}
        />
      </mesh>
    </group>
  )
}

function PlacedComponentView({
  placed,
  lit,
}: {
  placed: PlacedComponent
  lit: boolean
}) {
  const def = COMPONENT_LIBRARY[placed.type]
  const setComponentPosition = useSimulatorStore((s) => s.setComponentPosition)
  const drag = useDraggable(placed.position, (pos) =>
    setComponentPosition(placed.id, pos),
  )

  return (
    <group position={placed.position}>
      {/* Invisible drag handle covering the component footprint. */}
      <mesh
        position={[0, 0.08, 0]}
        {...drag}
        onPointerOver={() => (document.body.style.cursor = 'grab')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        <boxGeometry args={[0.7, 0.3, 0.7]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <ComponentBody placed={placed} lit={lit} />
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
  const { ledOn } = useSimulation()
  return (
    <>
      {components.map((placed) => (
        <PlacedComponentView
          key={placed.id}
          placed={placed}
          lit={ledOn[placed.id] ?? false}
        />
      ))}
    </>
  )
}
