import { describe, it, expect } from 'vitest'
import {
  COMPONENT_LIBRARY,
  COMPONENT_TYPES,
  componentPinId,
  componentPinPosition,
  collectComponentPins,
  type PlacedComponent,
} from './components'

describe('component library', () => {
  it('defines every type listed in the palette', () => {
    for (const type of COMPONENT_TYPES) {
      expect(COMPONENT_LIBRARY[type]).toBeDefined()
      expect(COMPONENT_LIBRARY[type].pins.length).toBeGreaterThan(0)
    }
  })

  it('gives each component pin a unique name within its type', () => {
    for (const type of COMPONENT_TYPES) {
      const names = COMPONENT_LIBRARY[type].pins.map((p) => p.name)
      expect(new Set(names).size).toBe(names.length)
    }
  })
})

describe('componentPinId / componentPinPosition', () => {
  it('namespaces pin ids by component instance', () => {
    expect(componentPinId('led-1', 'anode')).toBe('led-1:anode')
  })

  it('offsets pin positions from the component origin', () => {
    const placed: PlacedComponent = {
      id: 'led-1',
      type: 'led',
      position: [1, 0.12, 2],
    }
    const pin = COMPONENT_LIBRARY.led.pins[0]
    expect(componentPinPosition(placed, pin)).toEqual([
      1 + pin.offset[0],
      0.12 + pin.offset[1],
      2 + pin.offset[2],
    ])
  })
})

describe('collectComponentPins', () => {
  it('builds position and label lookups for every placed pin', () => {
    const components: PlacedComponent[] = [
      { id: 'led-1', type: 'led', position: [0, 0.12, 2] },
      { id: 'resistor-1', type: 'resistor', position: [1, 0.12, 2] },
    ]
    const { positions, labels } = collectComponentPins(components)

    const expectedCount =
      COMPONENT_LIBRARY.led.pins.length + COMPONENT_LIBRARY.resistor.pins.length
    expect(Object.keys(positions)).toHaveLength(expectedCount)

    expect(positions['led-1:anode']).toBeDefined()
    expect(labels['led-1:anode']).toContain('LED')
  })

  it('returns empty lookups when there are no components', () => {
    const { positions, labels } = collectComponentPins([])
    expect(positions).toEqual({})
    expect(labels).toEqual({})
  })
})
