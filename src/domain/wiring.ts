import type { Wire } from '../store/useSimulatorStore'

/**
 * Pure wiring logic, kept separate from the store and the 3D layer so it can be
 * unit-tested in isolation. The store calls into these functions to drive the
 * click-to-connect interaction.
 */

/** Rotating palette so consecutive wires are visually distinct. */
export const WIRE_COLORS = [
  '#ef4444', // red
  '#22c55e', // green
  '#3b82f6', // blue
  '#eab308', // yellow
  '#a855f7', // purple
  '#f97316', // orange
] as const

/** Pick a wire color by index, cycling through the palette. */
export function pickWireColor(index: number): string {
  return WIRE_COLORS[index % WIRE_COLORS.length]
}

/** Order-independent check for an existing connection between two pins. */
export function wireExists(
  wires: Wire[],
  pinA: string,
  pinB: string,
): boolean {
  return wires.some(
    (w) =>
      (w.startPinId === pinA && w.endPinId === pinB) ||
      (w.startPinId === pinB && w.endPinId === pinA),
  )
}

export interface PinClickResult {
  /** The pin awaiting a second click, or null if no selection is pending. */
  pendingPinId: string | null
  /** A newly formed wire, when the second click completed a connection. */
  wire?: Wire
}

/**
 * Resolve a pin click given the current pending selection.
 *
 * - No pending selection  -> the clicked pin becomes pending.
 * - Click the same pin    -> deselect (cancel).
 * - Click a different pin  -> form a wire (unless that pair is already wired).
 *
 * This function never mutates its inputs and is fully deterministic, so the
 * resulting wire id is stable for a given pin pair.
 */
export function resolvePinClick(
  pendingPinId: string | null,
  clickedPinId: string,
  wires: Wire[],
): PinClickResult {
  if (pendingPinId === null) {
    return { pendingPinId: clickedPinId }
  }

  // Clicking the pending pin again cancels the in-progress connection.
  if (pendingPinId === clickedPinId) {
    return { pendingPinId: null }
  }

  // Avoid duplicate connections between the same two pins.
  if (wireExists(wires, pendingPinId, clickedPinId)) {
    return { pendingPinId: null }
  }

  const wire: Wire = {
    id: `${pendingPinId}__${clickedPinId}`,
    startPinId: pendingPinId,
    endPinId: clickedPinId,
    color: pickWireColor(wires.length),
  }
  return { pendingPinId: null, wire }
}
