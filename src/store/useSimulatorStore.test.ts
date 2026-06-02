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
    const { pinStates, wires, components, isRunning } = getState()
    expect(pinStates).toEqual({})
    expect(wires).toEqual([])
    expect(components).toEqual([])
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

describe('addComponent / removeComponent', () => {
  it('adds a component with a unique sequential id', () => {
    getState().addComponent('led')
    getState().addComponent('led')
    const ids = getState().components.map((c) => c.id)
    expect(ids).toEqual(['led-1', 'led-2'])
    expect(new Set(ids).size).toBe(2)
  })

  it('lets different component types coexist', () => {
    getState().addComponent('led')
    getState().addComponent('resistor')
    getState().addComponent('potentiometer')
    expect(getState().components.map((c) => c.type)).toEqual([
      'led',
      'resistor',
      'potentiometer',
    ])
  })

  it('removes a component and any wires attached to its pins', () => {
    getState().addComponent('led') // led-1
    getState().addWire({
      id: 'w1',
      startPinId: 'arduino-uno:D13',
      endPinId: 'led-1:anode',
      color: '#fff',
    })
    getState().addWire({
      id: 'w2',
      startPinId: 'arduino-uno:D12',
      endPinId: 'arduino-uno:GND_D',
      color: '#fff',
    })

    getState().removeComponent('led-1')

    expect(getState().components).toEqual([])
    // Only the wire touching the removed component is dropped.
    expect(getState().wires.map((w) => w.id)).toEqual(['w2'])
  })

  it('ignores an unknown component type', () => {
    // @ts-expect-error — intentionally passing an invalid type
    getState().addComponent('not-a-real-part')
    expect(getState().components).toEqual([])
  })
})

describe('dragging — positions', () => {
  it('moves a placed component to a new position', () => {
    getState().addComponent('led') // led-1
    getState().setComponentPosition('led-1', [1.5, 0.12, -0.5])
    expect(getState().components[0].position).toEqual([1.5, 0.12, -0.5])
  })

  it('leaves other components untouched when moving one', () => {
    getState().addComponent('led')
    getState().addComponent('resistor')
    const [first, second] = getState().components
    getState().setComponentPosition(second.id, [2, 0.12, 2])
    expect(getState().components[0].position).toEqual(first.position)
    expect(getState().components[1].position).toEqual([2, 0.12, 2])
  })

  it('moves the board and toggles the dragging flag', () => {
    expect(getState().boardPosition).toEqual([0, 0, 0])
    getState().setBoardPosition([3, 0, 1])
    expect(getState().boardPosition).toEqual([3, 0, 1])

    expect(getState().isDragging).toBe(false)
    getState().setDragging(true)
    expect(getState().isDragging).toBe(true)
    getState().setDragging(false)
    expect(getState().isDragging).toBe(false)
  })
})

describe('loadSnapshot / reset — DynamoDB round-trip', () => {
  it('hydrates the full state from a snapshot', () => {
    const snapshot: SimulatorSnapshot = {
      pinStates: { 'arduino-uno:D13': 'HIGH' },
      wires: [sampleWire()],
      components: [{ id: 'led-1', type: 'led', position: [0, 0.12, 2] }],
      boardPosition: [1, 0, -2],
      isRunning: true,
    }
    getState().loadSnapshot(snapshot)
    const { pinStates, wires, components, boardPosition, isRunning } = getState()
    expect(pinStates).toEqual(snapshot.pinStates)
    expect(wires).toEqual(snapshot.wires)
    expect(components).toEqual(snapshot.components)
    expect(boardPosition).toEqual([1, 0, -2])
    expect(isRunning).toBe(true)
  })

  it('survives a JSON serialize/deserialize cycle (DynamoDB-compatible)', () => {
    getState().setPinState('arduino-uno:D13', 'HIGH')
    getState().addWire(sampleWire())
    getState().addComponent('led')
    getState().toggleSimulation()

    const { pinStates, wires, components, boardPosition, isRunning } = getState()
    const snapshot: SimulatorSnapshot = {
      pinStates,
      wires,
      components,
      boardPosition,
      isRunning,
    }

    // Simulate persisting to / reading back from DynamoDB.
    const roundTripped: SimulatorSnapshot = JSON.parse(
      JSON.stringify(snapshot),
    )

    getState().reset()
    expect(getState().wires).toEqual([])
    expect(getState().components).toEqual([])

    getState().loadSnapshot(roundTripped)
    expect(getState().pinStates).toEqual(snapshot.pinStates)
    expect(getState().wires).toEqual(snapshot.wires)
    expect(getState().components).toEqual(snapshot.components)
    expect(getState().isRunning).toBe(snapshot.isRunning)
  })

  it('reset returns the store to its empty initial state', () => {
    getState().setPinState('arduino-uno:D13', 'HIGH')
    getState().addWire(sampleWire())
    getState().addComponent('led')
    getState().setBoardPosition([2, 0, 2])
    getState().toggleSimulation()
    getState().selectPin('arduino-uno:A0')

    getState().reset()

    expect(getState().pinStates).toEqual({})
    expect(getState().wires).toEqual([])
    expect(getState().components).toEqual([])
    expect(getState().boardPosition).toEqual([0, 0, 0])
    expect(getState().isRunning).toBe(false)
    expect(getState().pendingPinId).toBeNull()

    // The id sequence resets too: the next component is led-1 again.
    getState().addComponent('led')
    expect(getState().components[0].id).toBe('led-1')
  })
})
