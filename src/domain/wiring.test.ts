import { describe, it, expect } from 'vitest'
import {
  pickWireColor,
  wireExists,
  resolvePinClick,
  WIRE_COLORS,
} from './wiring'
import type { Wire } from '../store/useSimulatorStore'

const wire = (start: string, end: string): Wire => ({
  id: `${start}__${end}`,
  startPinId: start,
  endPinId: end,
  color: '#000000',
})

describe('pickWireColor', () => {
  it('returns palette colors and cycles past the end', () => {
    expect(pickWireColor(0)).toBe(WIRE_COLORS[0])
    expect(pickWireColor(1)).toBe(WIRE_COLORS[1])
    expect(pickWireColor(WIRE_COLORS.length)).toBe(WIRE_COLORS[0])
  })
})

describe('wireExists', () => {
  it('detects connections regardless of pin order', () => {
    const wires = [wire('A', 'B')]
    expect(wireExists(wires, 'A', 'B')).toBe(true)
    expect(wireExists(wires, 'B', 'A')).toBe(true)
    expect(wireExists(wires, 'A', 'C')).toBe(false)
  })
})

describe('resolvePinClick', () => {
  it('selects a pin when nothing is pending', () => {
    expect(resolvePinClick(null, 'A', [])).toEqual({ pendingPinId: 'A' })
  })

  it('cancels when the same pin is clicked twice', () => {
    expect(resolvePinClick('A', 'A', [])).toEqual({ pendingPinId: null })
  })

  it('forms a wire between two different pins', () => {
    const result = resolvePinClick('A', 'B', [])
    expect(result.pendingPinId).toBeNull()
    expect(result.wire).toEqual({
      id: 'A__B',
      startPinId: 'A',
      endPinId: 'B',
      color: WIRE_COLORS[0],
    })
  })

  it('colors new wires by the current wire count', () => {
    const existing = [wire('X', 'Y')]
    const result = resolvePinClick('A', 'B', existing)
    expect(result.wire?.color).toBe(WIRE_COLORS[1])
  })

  it('does not create a duplicate connection', () => {
    const existing = [wire('A', 'B')]
    const result = resolvePinClick('B', 'A', existing)
    expect(result.pendingPinId).toBeNull()
    expect(result.wire).toBeUndefined()
  })
})
