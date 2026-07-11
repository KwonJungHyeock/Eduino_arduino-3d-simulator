import { useMemo } from 'react'
import { useSimulatorStore } from '../store/useSimulatorStore'
import { simulate, EMPTY_SIM, type SimResult } from '../domain/simulation'

/**
 * Derives the live circuit result from the store. Only evaluates while the
 * simulation is running; otherwise everything reads as off. Memoized on the
 * inputs so the scene re-renders only when the circuit actually changes.
 */
export function useSimulation(): SimResult {
  const isRunning = useSimulatorStore((s) => s.isRunning)
  const wires = useSimulatorStore((s) => s.wires)
  const components = useSimulatorStore((s) => s.components)
  const pinStates = useSimulatorStore((s) => s.pinStates)
  const pressed = useSimulatorStore((s) => s.pressedButtons)

  return useMemo(
    () =>
      isRunning
        ? simulate({ wires, components, pinStates, pressed })
        : EMPTY_SIM,
    [isRunning, wires, components, pinStates, pressed],
  )
}
