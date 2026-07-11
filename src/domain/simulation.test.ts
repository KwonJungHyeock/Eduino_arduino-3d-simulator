import { describe, it, expect } from 'vitest'
import { simulate } from './simulation'
import type { Wire } from '../store/useSimulatorStore'
import type { PlacedComponent } from './components'

let wireSeq = 0
const wire = (a: string, b: string): Wire => ({
  id: `w${wireSeq++}`,
  startPinId: a,
  endPinId: b,
  color: '#fff',
})

const led = (id: string): PlacedComponent => ({
  id,
  type: 'led',
  position: [0, 0.12, 2],
})
const resistor = (id: string): PlacedComponent => ({
  id,
  type: 'resistor',
  position: [0, 0.12, 2],
})
const button = (id: string): PlacedComponent => ({
  id,
  type: 'pushbutton',
  position: [0, 0.12, 2],
})

describe('simulate — LED lighting', () => {
  it('lights an LED wired 5V → resistor → LED → GND', () => {
    const components = [resistor('r1'), led('d1')]
    const wires = [
      wire('arduino-uno:5V', 'r1:a'),
      wire('r1:b', 'd1:anode'),
      wire('d1:cathode', 'arduino-uno:GND1'),
    ]
    const result = simulate({ wires, components })
    expect(result.ledOn['d1']).toBe(true)
    expect(result.highPins).toContain('arduino-uno:5V')
    expect(result.highPins).toContain('d1:anode')
  })

  it('keeps the LED off when the cathode never reaches ground', () => {
    const components = [resistor('r1'), led('d1')]
    const wires = [
      wire('arduino-uno:5V', 'r1:a'),
      wire('r1:b', 'd1:anode'),
      // cathode left floating
    ]
    expect(simulate({ wires, components }).ledOn['d1']).toBe(false)
  })

  it('keeps the LED off when wired backwards (anode to GND)', () => {
    const components = [led('d1')]
    const wires = [
      wire('arduino-uno:5V', 'd1:cathode'),
      wire('d1:anode', 'arduino-uno:GND1'),
    ]
    expect(simulate({ wires, components }).ledOn['d1']).toBe(false)
  })

  it('lights an LED driven by a HIGH board pin (e.g. D13)', () => {
    const components = [led('d1')]
    const wires = [
      wire('arduino-uno:D13', 'd1:anode'),
      wire('d1:cathode', 'arduino-uno:GND_D'),
    ]
    const off = simulate({ wires, components })
    expect(off.ledOn['d1']).toBe(false) // D13 not driven yet

    const on = simulate({
      wires,
      components,
      pinStates: { 'arduino-uno:D13': 'HIGH' },
    })
    expect(on.ledOn['d1']).toBe(true)
  })

  it('propagates HIGH only through resistors that are in the path', () => {
    const components = [resistor('r1'), led('d1')]
    // Resistor dangling (only one leg wired): no path to the LED anode.
    const wires = [
      wire('arduino-uno:5V', 'r1:a'),
      wire('d1:anode', 'arduino-uno:D2'),
      wire('d1:cathode', 'arduino-uno:GND1'),
    ]
    expect(simulate({ wires, components }).ledOn['d1']).toBe(false)
  })
})

describe('simulate — pushbutton', () => {
  it('blocks current until pressed, then completes the circuit', () => {
    const components = [button('b1'), led('d1')]
    const wires = [
      wire('arduino-uno:5V', 'b1:1a'),
      wire('b1:2a', 'd1:anode'),
      wire('d1:cathode', 'arduino-uno:GND1'),
    ]
    expect(simulate({ wires, components }).ledOn['d1']).toBe(false)
    expect(simulate({ wires, components, pressed: ['b1'] }).ledOn['d1']).toBe(
      true,
    )
  })

  it('conducts within a side even when open (1a↔1b)', () => {
    const components = [button('b1'), led('d1')]
    const wires = [
      wire('arduino-uno:5V', 'b1:1a'),
      wire('b1:1b', 'd1:anode'), // same side as 5V
      wire('d1:cathode', 'arduino-uno:GND1'),
    ]
    // Same side is always connected, so this lights without pressing.
    expect(simulate({ wires, components }).ledOn['d1']).toBe(true)
  })
})

describe('simulate — warnings', () => {
  it('flags a direct power-to-ground short', () => {
    const wires = [wire('arduino-uno:5V', 'arduino-uno:GND1')]
    const result = simulate({ wires, components: [] })
    expect(result.warnings.length).toBeGreaterThan(0)
  })

  it('reports no warnings for an open circuit', () => {
    expect(simulate({ wires: [], components: [] }).warnings).toEqual([])
  })
})
