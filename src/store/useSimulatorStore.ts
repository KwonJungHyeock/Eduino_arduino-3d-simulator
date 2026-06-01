import { create } from 'zustand'

/**
 * Core domain types for the 3D Arduino / AIoT sensor simulator.
 *
 * These shapes are intentionally plain JSON-serializable structures so the
 * entire workspace state can be persisted to (and rehydrated from) AWS
 * DynamoDB as a single document later on. Avoid storing class instances,
 * Three.js objects, or functions in here — keep it serializable.
 */

/** Logical voltage level reported by an Arduino pin. */
export type PinState = 'HIGH' | 'LOW'

/**
 * Map of pin identifier -> current logical state.
 *
 * The key (pinId) is a stable string such as `"arduino-uno:D13"` so it
 * survives serialization and uniquely addresses a pin across boards.
 */
export type PinStates = Record<string, PinState>

/**
 * A virtual wire connecting two pins in the 3D workspace.
 *
 * `id` lets us address/remove a specific wire; `color` is stored so the
 * visual rendering can be reconstructed exactly after a reload.
 */
export interface Wire {
  id: string
  /** pinId of the connection's origin. */
  startPinId: string
  /** pinId of the connection's destination. */
  endPinId: string
  /** CSS/hex color string used to render the wire (e.g. "#ff0000"). */
  color: string
}

/**
 * The serializable portion of the simulator state.
 *
 * This is exactly what we intend to write to DynamoDB as a project/document.
 * Keeping it separate from the actions makes it trivial to (de)serialize:
 *   - export: pick these fields from the store
 *   - import: pass a SimulatorSnapshot to `loadSnapshot`
 */
export interface SimulatorSnapshot {
  pinStates: PinStates
  wires: Wire[]
  isRunning: boolean
}

/** Actions exposed by the store. */
export interface SimulatorActions {
  /** Toggle the running state of the simulation. */
  toggleSimulation: () => void
  /** Set the logical state of a single pin. */
  setPinState: (pinId: string, state: PinState) => void
  /** Add a new wire to the workspace. */
  addWire: (wire: Wire) => void
  /** Remove a wire by its id. */
  removeWire: (wireId: string) => void
  /** Replace the entire serializable state (e.g. when loading from DynamoDB). */
  loadSnapshot: (snapshot: SimulatorSnapshot) => void
  /** Reset the workspace back to its initial empty state. */
  reset: () => void
}

export type SimulatorStore = SimulatorSnapshot & SimulatorActions

/** Initial, empty workspace state. */
const initialState: SimulatorSnapshot = {
  pinStates: {},
  wires: [],
  isRunning: false,
}

/**
 * Global simulator store.
 *
 * Single source of truth for pin states, wiring, and simulation run-state.
 * A unidirectional data flow keeps the 3D scene a pure function of this state.
 */
export const useSimulatorStore = create<SimulatorStore>((set) => ({
  ...initialState,

  toggleSimulation: () =>
    set((state) => ({ isRunning: !state.isRunning })),

  setPinState: (pinId, state) =>
    set((prev) => ({
      pinStates: { ...prev.pinStates, [pinId]: state },
    })),

  addWire: (wire) =>
    set((prev) => ({ wires: [...prev.wires, wire] })),

  removeWire: (wireId) =>
    set((prev) => ({
      wires: prev.wires.filter((w) => w.id !== wireId),
    })),

  loadSnapshot: (snapshot) => set({ ...snapshot }),

  reset: () => set({ ...initialState }),
}))
