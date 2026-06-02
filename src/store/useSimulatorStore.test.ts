import { describe, it, expect, beforeEach } from 'vitest'
import {
  useSimulatorStore,
  type SimulatorSnapshot,
  type Wire,
} from './useSimulatorStore'

// Convenience accessors for driving the store outside of React.
const getState = () => useSimulatorStore.getState()

const sampleWire = (overrides: Partial<Wire> = {}): Wire => ({
  id: 'wire-1',
  startPinId: 'arduino-uno:D13',
  endPinId: 'led-1:anode',
  color: '#ff0000',
  ...overrides,
})

beforeEach(() => {
  // Each test starts from a pristine store.
  getState().reset()
})

describe('useSimulatorStore — initial state', () => {
  it('starts empty and idle', () => {
    const { pinStates, wires, isRunning } = getState()
    expect(pinStates).toEqual({})
    expect(wires).toEqual([])
    expect(isRunning).toBe(false)
  })
})

describe('toggleSimulation', () => {
  it('flips isRunning back and forth', () => {
    expect(getState().isRunning).toBe(false)
    getState().toggleSimulation()
    expect(getState().isRunning).toBe(true)
    getState().toggleSimulation()
    expect(getState().isRunning).toBe(false)
  })
})

describe('setPinState', () => {
  it('sets a pin to HIGH and LOW', () => {
    getState().setPinState('arduino-uno:D13', 'HIGH')
    expect(getState().pinStates['arduino-uno:D13']).toBe('HIGH')

    getState().setPinState('arduino-uno:D13', 'LOW')
    expect(getState().pinStates['arduino-uno:D13']).toBe('LOW')
  })

  it('tracks multiple pins independently', () => {
    getState().setPinState('arduino-uno:D13', 'HIGH')
    getState().setPinState('arduino-uno:A0', 'LOW')
    expect(getState().pinStates).toEqual({
      'arduino-uno:D13': 'HIGH',
      'arduino-uno:A0': 'LOW',
    })
  })

  it('does not mutate the previous pinStates object (immutability)', () => {
    const before = getState().pinStates
    getState().setPinState('arduino-uno:D13', 'HIGH')
    const after = getState().pinStates
    expect(after).not.toBe(before)
    expect(before).toEqual({})
  })
})

describe('addWire / removeWire', () => {
  it('adds wires in order', () => {
    const w1 = sampleWire({ id: 'wire-1' })
    const w2 = sampleWire({ id: 'wire-2', color: '#00ff00' })
    getState().addWire(w1)
    getState().addWire(w2)
    expect(getState().wires).toEqual([w1, w2])
  })

  it('removes a wire by id without affecting others', () => {
    const w1 = sampleWire({ id: 'wire-1' })
    const w2 = sampleWire({ id: 'wire-2' })
    getState().addWire(w1)
    getState().addWire(w2)
    getState().removeWire('wire-1')
    expect(getState().wires).toEqual([w2])
  })

  it('is a no-op when removing an unknown wire id', () => {
    const w1 = sampleWire({ id: 'wire-1' })
    getState().addWire(w1)
    getState().removeWire('does-not-exist')
    expect(getState().wires).toEqual([w1])
  })
})

describe('selectPin — click-to-connect wiring', () => {
  it('marks the first clicked pin as pending', () => {
    getState().selectPin('arduino-uno:D13')
    expect(getState().pendingPinId).toBe('arduino-uno:D13')
    expect(getState().wires).toEqual([])
  })

  it('wires two pins on the second click and clears the pending pin', () => {
    getState().selectPin('arduino-uno:D13')
    getState().selectPin('arduino-uno:A0')
    expect(getState().pendingPinId).toBeNull()
    expect(getState().wires).toHaveLength(1)
    expect(getState().wires[0]).toMatchObject({
      startPinId: 'arduino-uno:D13',
      endPinId: 'arduino-uno:A0',
    })
  })

  it('cancels when the same pin is clicked twice', () => {
    getState().selectPin('arduino-uno:D13')
    getState().selectPin('arduino-uno:D13')
    expect(getState().pendingPinId).toBeNull()
    expect(getState().wires).toEqual([])
  })

  it('does not create duplicate connections', () => {
    getState().selectPin('arduino-uno:D13')
    getState().selectPin('arduino-uno:A0')
    getState().selectPin('arduino-uno:A0')
    getState().selectPin('arduino-uno:D13')
    expect(getState().wires).toHaveLength(1)
  })
})

describe('clearWires / clearSelection', () => {
  it('clearWires removes all wires and any pending selection', () => {
    getState().selectPin('arduino-uno:D13')
    getState().selectPin('arduino-uno:A0')
    getState().selectPin('arduino-uno:D2')
    getState().clearWires()
    expect(getState().wires).toEqual([])
    expect(getState().pendingPinId).toBeNull()
  })

  it('clearSelection cancels a pending pin without touching wires', () => {
    getState().addWire(sampleWire())
    getState().selectPin('arduino-uno:D13')
    getState().clearSelection()
    expect(getState().pendingPinId).toBeNull()
    expect(getState().wires).toHaveLength(1)
  })
})

describe('loadSnapshot / reset — DynamoDB round-trip', () => {
  it('hydrates the full state from a snapshot', () => {
    const snapshot: SimulatorSnapshot = {
      pinStates: { 'arduino-uno:D13': 'HIGH' },
      wires: [sampleWire()],
      isRunning: true,
    }
    getState().loadSnapshot(snapshot)
    const { pinStates, wires, isRunning } = getState()
    expect(pinStates).toEqual(snapshot.pinStates)
    expect(wires).toEqual(snapshot.wires)
    expect(isRunning).toBe(true)
  })

  it('survives a JSON serialize/deserialize cycle (DynamoDB-compatible)', () => {
    getState().setPinState('arduino-uno:D13', 'HIGH')
    getState().addWire(sampleWire())
    getState().toggleSimulation()

    const { pinStates, wires, isRunning } = getState()
    const snapshot: SimulatorSnapshot = { pinStates, wires, isRunning }

    // Simulate persisting to / reading back from DynamoDB.
    const roundTripped: SimulatorSnapshot = JSON.parse(
      JSON.stringify(snapshot),
    )

    getState().reset()
    expect(getState().wires).toEqual([])

    getState().loadSnapshot(roundTripped)
    expect(getState().pinStates).toEqual(snapshot.pinStates)
    expect(getState().wires).toEqual(snapshot.wires)
    expect(getState().isRunning).toBe(snapshot.isRunning)
  })

  it('reset returns the store to its empty initial state', () => {
    getState().setPinState('arduino-uno:D13', 'HIGH')
    getState().addWire(sampleWire())
    getState().toggleSimulation()
    getState().selectPin('arduino-uno:A0')

    getState().reset()

    expect(getState().pinStates).toEqual({})
    expect(getState().wires).toEqual([])
    expect(getState().isRunning).toBe(false)
    expect(getState().pendingPinId).toBeNull()
  })
})
