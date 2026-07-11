import { useMemo } from 'react'
import { useSimulatorStore } from '../store/useSimulatorStore'
import { PIN_POSITIONS } from '../domain/board'
import { collectComponentPins } from '../domain/components'

export type PinPositions = Record<string, [number, number, number]>

/**
 * Merged world positions of every connectable pin — board pins (shifted by the
 * draggable board position) plus all component pins. Shared by the wire
 * renderer and the drag-to-connect preview so they stay in sync.
 */
export function usePinPositions(): PinPositions {
  const components = useSimulatorStore((s) => s.components)
  const boardPosition = useSimulatorStore((s) => s.boardPosition)

  return useMemo(() => {
    const [bx, by, bz] = boardPosition
    const out: PinPositions = {}
    for (const id in PIN_POSITIONS) {
      const [x, y, z] = PIN_POSITIONS[id]
      out[id] = [x + bx, y + by, z + bz]
    }
    return { ...out, ...collectComponentPins(components).positions }
  }, [components, boardPosition])
}
