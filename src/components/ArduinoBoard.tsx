import { useEffect, useMemo, useState } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { useSimulatorStore } from '../store/useSimulatorStore'
import { createPcbTexture } from '../three/createPcbTexture'
import { useDraggable } from '../three/useDraggable'
import {
  ARDUINO_UNO_PINS,
  BOARD_SIZE,
  BOARD_TOP_Y,
  HEADER_ROWS,
  type BoardPin,
} from '../domain/board'

const [BOARD_W, BOARD_H, BOARD_D] = BOARD_SIZE
const ARDUINO_TEAL = '#0b8c93'

/** Color of a pin header based on its current logical state. */
function pinColor(isPending: boolean, isHigh: boolean): string {
  if (isPending) return '#facc15' // amber — awaiting second click
  if (isHigh) return '#ef4444' // red — HIGH
  return '#e7c873' // brass — LOW / unset
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

  // Labels sit just outside the board edge so they don't cover the pins.
  const labelZ = pin.position[2] < 0 ? -0.16 : 0.16
  const color = pinColor(isPending, isHigh)
  const active = hovered || isPending

  return (
    <group position={pin.position}>
      <mesh
        onClick={handleClick}
        // Pointer-down on a pin must not start a board drag.
        onPointerDown={(e) => e.stopPropagation()}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
        scale={active ? 1.4 : 1}
      >
        <cylinderGeometry args={[0.045, 0.045, 0.12, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={isPending ? '#facc15' : isHigh ? '#7f1d1d' : '#000000'}
          emissiveIntensity={isPending ? 0.8 : isHigh ? 0.5 : 0}
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>
      <Text
        position={[0, 0.02, labelZ]}
        fontSize={0.07}
        color={active ? '#fde68a' : '#dbeafe'}
        anchorX="center"
        anchorY="middle"
      >
        {pin.label}
      </Text>
    </group>
  )
}

/** Black plastic header strip beneath a row of pins. */
function HeaderStrip({ z, length }: { z: number; length: number }) {
  return (
    <mesh position={[0, BOARD_TOP_Y + 0.025, z]}>
      <boxGeometry args={[length, 0.07, 0.22]} />
      <meshStandardMaterial color="#15181d" roughness={0.7} metalness={0.1} />
    </mesh>
  )
}

/** Static fixtures that make the PCB read as an Arduino Uno. */
function BoardFixtures() {
  const leftX = -BOARD_W / 2
  return (
    <group>
      {/* USB-B connector (metal) protruding from the top-left edge. */}
      <mesh position={[leftX - 0.18, BOARD_TOP_Y + 0.13, -0.55]} castShadow>
        <boxGeometry args={[0.55, 0.26, 0.7]} />
        <meshStandardMaterial color="#b8bcc4" metalness={0.9} roughness={0.25} />
      </mesh>

      {/* Barrel power jack (black) protruding from the bottom-left edge. */}
      <mesh
        position={[leftX - 0.12, BOARD_TOP_Y + 0.11, 0.6]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[0.13, 0.13, 0.45, 20]} />
        <meshStandardMaterial color="#0a0a0c" metalness={0.3} roughness={0.6} />
      </mesh>

      {/* ATmega328 microcontroller IC. */}
      <mesh position={[0.35, BOARD_TOP_Y + 0.06, 0.25]} castShadow>
        <boxGeometry args={[1.0, 0.12, 0.42]} />
        <meshStandardMaterial color="#0c0c0e" roughness={0.5} />
      </mesh>

      {/* 16 MHz crystal. */}
      <mesh position={[-0.5, BOARD_TOP_Y + 0.07, -0.2]} castShadow>
        <boxGeometry args={[0.28, 0.12, 0.16]} />
        <meshStandardMaterial color="#c8ccd2" metalness={0.85} roughness={0.3} />
      </mesh>

      {/* Reset button near the USB connector. */}
      <mesh position={[-1.15, BOARD_TOP_Y + 0.06, -0.62]} castShadow>
        <boxGeometry args={[0.16, 0.1, 0.16]} />
        <meshStandardMaterial color="#9aa0aa" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  )
}

/**
 * The Arduino Uno board: a teal PCB with realistic fixtures plus interactive
 * pin headers. All rendering and interaction happen on the client GPU. The PCB
 * brightens while the simulation is running to reflect the store's `isRunning`.
 */
export default function ArduinoBoard() {
  const isRunning = useSimulatorStore((s) => s.isRunning)
  const boardPosition = useSimulatorStore((s) => s.boardPosition)
  const setBoardPosition = useSimulatorStore((s) => s.setBoardPosition)
  const drag = useDraggable(boardPosition, setBoardPosition)

  // Build the silkscreen texture once; free its GPU memory on unmount.
  const pcbTexture = useMemo(() => createPcbTexture(), [])
  useEffect(() => () => pcbTexture.dispose(), [pcbTexture])

  return (
    <group position={boardPosition}>
      {/* PCB body — rests on the grid (y = 0) with its top at BOARD_TOP_Y. */}
      <mesh position={[0, BOARD_H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[BOARD_W, BOARD_H, BOARD_D]} />
        <meshStandardMaterial
          color={ARDUINO_TEAL}
          emissive={isRunning ? '#00e5ff' : '#000000'}
          emissiveIntensity={isRunning ? 0.35 : 0}
          metalness={0.2}
          roughness={0.65}
        />
      </mesh>

      {/* Printed silkscreen on the top surface — also the board's drag handle. */}
      <mesh
        position={[0, BOARD_TOP_Y + 0.002, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        {...drag}
      >
        <planeGeometry args={[BOARD_W, BOARD_D]} />
        <meshStandardMaterial
          map={pcbTexture}
          emissive={isRunning ? '#00e5ff' : '#000000'}
          emissiveIntensity={isRunning ? 0.18 : 0}
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>

      {HEADER_ROWS.map((row) => (
        <HeaderStrip key={row.z} z={row.z} length={row.length} />
      ))}

      <BoardFixtures />

      {ARDUINO_UNO_PINS.map((pin) => (
        <Pin key={pin.id} pin={pin} />
      ))}
    </group>
  )
}
