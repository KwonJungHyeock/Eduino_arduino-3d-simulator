import { QuadraticBezierLine } from '@react-three/drei'
import { useSimulatorStore } from '../store/useSimulatorStore'
import { PIN_POSITIONS } from '../domain/board'

/** Lift the wire's apex above the two endpoints so it arcs clearly. */
function midpoint(
  a: [number, number, number],
  b: [number, number, number],
): [number, number, number] {
  return [
    (a[0] + b[0]) / 2,
    Math.max(a[1], b[1]) + 0.7,
    (a[2] + b[2]) / 2,
  ]
}

/**
 * Renders every wire in the store as a curved cable between its two pins.
 * Pins whose positions are unknown (e.g. pointing at a not-yet-placed sensor)
 * are skipped rather than throwing.
 */
export default function Wires() {
  const wires = useSimulatorStore((s) => s.wires)

  return (
    <>
      {wires.map((wire) => {
        const start = PIN_POSITIONS[wire.startPinId]
        const end = PIN_POSITIONS[wire.endPinId]
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
