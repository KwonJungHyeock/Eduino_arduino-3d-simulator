import { create } from 'zustand'
import { resolvePinClick } from '../domain/wiring'
import {
  COMPONENT_LIBRARY,
  type ComponentType,
  type PlacedComponent,
} from '../domain/components'

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
  /** Components placed in the workspace (LEDs, resistors, …). */
  components: PlacedComponent[]
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
  /** Remove every wire from the workspace. */
  clearWires: () => void
  /**
   * Handle a pin click in the 3D scene to drive click-to-connect wiring:
   * first click selects a pin, a second click on a different pin wires them.
   */
  selectPin: (pinId: string) => void
  /** Cancel any in-progress pin selection. */
  clearSelection: () => void
  /** Add a component of the given type at an auto-assigned position. */
  addComponent: (type: ComponentType) => void
  /** Remove a component and any wires attached to its pins. */
  removeComponent: (componentId: string) => void
  /** Replace the entire serializable state (e.g. when loading from DynamoDB). */
  loadSnapshot: (snapshot: SimulatorSnapshot) => void
  /** Reset the workspace back to its initial empty state. */
  reset: () => void
}

/**
 * Full store shape: the persisted snapshot, the actions, plus transient UI
 * state that is intentionally NOT part of `SimulatorSnapshot` and therefore
 * never written to DynamoDB (e.g. the in-progress wiring selection).
 */
export type SimulatorStore = SimulatorSnapshot &
  SimulatorActions & {
    /** Pin awaiting a second click during wiring, or null. Transient. */
    pendingPinId: string | null
    /** Monotonic counter for unique component ids. Transient. */
    componentSeq: number
  }

/** Initial, empty workspace state. */
const initialState: SimulatorSnapshot = {
  pinStates: {},
  wires: [],
  components: [],
  isRunning: false,
}

/** Lay out newly added components in a tidy row in front of the board. */
function nextComponentPosition(index: number): [number, number, number] {
  const perRow = 5
  const col = index % perRow
  const row = Math.floor(index / perRow)
  return [-1.6 + col * 0.8, 0.12, 2.1 + row * 0.8]
}

/** Highest numeric suffix already used across component ids, for seq recovery. */
function maxComponentSeq(components: PlacedComponent[]): number {
  return components.reduce((max, c) => {
    const n = Number(c.id.split('-').pop())
    return Number.isFinite(n) ? Math.max(max, n) : max
  }, 0)
}

/**
 * Global simulator store.
 *
 * Single source of truth for pin states, wiring, and simulation run-state.
 * A unidirectional data flow keeps the 3D scene a pure function of this state.
 */
export const useSimulatorStore = create<SimulatorStore>((set) => ({
  ...initialState,
  pendingPinId: null,
  componentSeq: 0,

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

  clearWires: () => set({ wires: [], pendingPinId: null }),

  selectPin: (pinId) =>
    set((prev) => {
      const result = resolvePinClick(prev.pendingPinId, pinId, prev.wires)
      return {
        pendingPinId: result.pendingPinId,
        wires: result.wire ? [...prev.wires, result.wire] : prev.wires,
      }
    }),

  clearSelection: () => set({ pendingPinId: null }),

  addComponent: (type) =>
    set((prev) => {
      // Guard against an invalid type so ids and rendering stay consistent.
      if (!COMPONENT_LIBRARY[type]) return prev
      const seq = prev.componentSeq + 1
      const placed: PlacedComponent = {
        id: `${type}-${seq}`,
        type,
        position: nextComponentPosition(prev.components.length),
      }
      return {
        components: [...prev.components, placed],
        componentSeq: seq,
      }
    }),

  removeComponent: (componentId) =>
    set((prev) => ({
      components: prev.components.filter((c) => c.id !== componentId),
      // Drop wires whose endpoints belong to the removed component.
      wires: prev.wires.filter(
        (w) =>
          !w.startPinId.startsWith(`${componentId}:`) &&
          !w.endPinId.startsWith(`${componentId}:`),
      ),
      pendingPinId: prev.pendingPinId?.startsWith(`${componentId}:`)
        ? null
        : prev.pendingPinId,
    })),

  // Transient fields are reset on load/reset since they are not persisted.
  loadSnapshot: (snapshot) =>
    set({
      ...snapshot,
      components: snapshot.components ?? [],
      pendingPinId: null,
      componentSeq: maxComponentSeq(snapshot.components ?? []),
    }),

  reset: () => set({ ...initialState, pendingPinId: null, componentSeq: 0 }),
}))
