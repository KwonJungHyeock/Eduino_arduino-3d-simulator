import { useMemo } from 'react'
import { QuadraticBezierLine } from '@react-three/drei'
import { useSimulatorStore } from '../store/useSimulatorStore'
import { PIN_POSITIONS } from '../domain/board'
import { collectComponentPins } from '../domain/components'

/** Lift the wire's apex above the two endpoints so it arcs clearly. */
function midpoint(
  a: [number, number, number],
  b: [number, number, number],
): [number, number, number] {
  return [(a[0] + b[0]) / 2, Math.max(a[1], b[1]) + 0.7, (a[2] + b[2]) / 2]
}

/**
 * Renders every wire in the store as a curved cable between its two pins.
 * Endpoints may be board pins or component pins; unknown pins are skipped.
 */
export default function Wires() {
  const wires = useSimulatorStore((s) => s.wires)
  const components = useSimulatorStore((s) => s.components)
  const boardPosition = useSimulatorStore((s) => s.boardPosition)

  // Board pin positions shift with the (draggable) board; merge with the live
  // component pin positions.
  const positions = useMemo(() => {
    const [bx, by, bz] = boardPosition
    const board: Record<string, [number, number, number]> = {}
    for (const id in PIN_POSITIONS) {
      const [x, y, z] = PIN_POSITIONS[id]
      board[id] = [x + bx, y + by, z + bz]
    }
    return { ...board, ...collectComponentPins(components).positions }
  }, [components, boardPosition])

  return (
    <>
      {wires.map((wire) => {
        const start = positions[wire.startPinId]
        const end = positions[wire.endPinId]
        if (!start || !end) return null

        return (
          <QuadraticBezierLine
            key={wire.id}
            start={start}
            end={end}
            mid={midpoint(start, end)}
            color={wire.color}
            lineWidth={3}
          />
        )
      })}
    </>
  )
}
