import { useState } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { useSimulatorStore } from '../store/useSimulatorStore'
import {
  ARDUINO_UNO_PINS,
  BOARD_SIZE,
  type BoardPin,
} from '../domain/board'

/** Color used to render a pin header based on its current logical state. */
function pinColor(isPending: boolean, isHigh: boolean): string {
  if (isPending) return '#facc15' // amber — awaiting second click
  if (isHigh) return '#ef4444' // red — HIGH
  return '#cbd5e1' // slate — LOW / unset
}

function Pin({ pin }: { pin: BoardPin }) {
  const [hovered, setHovered] = useState(false)
  const isPending = useSimulatorStore((s) => s.pendingPinId === pin.id)
  const isHigh = useSimulatorStore((s) => s.pinStates[pin.id] === 'HIGH')
  const selectPin = useSimulatorStore((s) => s.selectPin)

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    selectPin(pin.id)
  }

  const handleOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHovered(true)
    document.body.style.cursor = 'pointer'
  }

  const handleOut = () => {
    setHovered(false)
    document.body.style.cursor = 'auto'
  }

  const color = pinColor(isPending, isHigh)

  return (
    <group position={pin.position}>
      <mesh
        onClick={handleClick}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
        scale={hovered || isPending ? 1.35 : 1}
      >
        <cylinderGeometry args={[0.06, 0.06, 0.14, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={isPending ? '#facc15' : isHigh ? '#7f1d1d' : '#000000'}
          emissiveIntensity={isPending ? 0.7 : isHigh ? 0.5 : 0}
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>
      {/* Pin label floats just above the header, always facing the camera. */}
      <Text
        position={[0, 0.22, 0]}
        fontSize={0.12}
        color="#e2e8f0"
        anchorX="center"
        anchorY="middle"
      >
        {pin.label}
      </Text>
    </group>
  )
}

/**
 * The Arduino Uno board: a base plate plus interactive pin headers.
 *
 * All rendering and interaction happen on the client GPU. The board pulses
 * blue while the simulation is running to reflect the store's `isRunning`.
 */
export default function ArduinoBoard() {
  const isRunning = useSimulatorStore((s) => s.isRunning)

  return (
    <group>
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={BOARD_SIZE} />
        <meshStandardMaterial
          color={isRunning ? '#0e7490' : '#0b6e4f'}
          emissive={isRunning ? '#082f49' : '#000000'}
          emissiveIntensity={isRunning ? 0.5 : 0}
          metalness={0.2}
          roughness={0.7}
        />
      </mesh>

      {ARDUINO_UNO_PINS.map((pin) => (
        <Pin key={pin.id} pin={pin} />
      ))}
    </group>
  )
}
