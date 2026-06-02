import { describe, it, expect } from 'vitest'
import {
  ARDUINO_UNO_PINS,
  BOARD_ID,
  PIN_POSITIONS,
  PIN_LABELS,
} from './board'

describe('Arduino Uno board model', () => {
  it('exposes 14 digital, 6 analog and 6 power/ground pins', () => {
    const byType = (t: string) =>
      ARDUINO_UNO_PINS.filter((p) => p.type === t).length
    expect(byType('digital')).toBe(14)
    expect(byType('analog')).toBe(6)
    expect(byType('power') + byType('ground')).toBe(6)
    expect(ARDUINO_UNO_PINS).toHaveLength(26)
  })

  it('gives every pin a unique, namespaced id', () => {
    const ids = ARDUINO_UNO_PINS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.every((id) => id.startsWith(`${BOARD_ID}:`))).toBe(true)
  })

  it('builds a position lookup with a valid 3D coordinate per pin', () => {
    expect(Object.keys(PIN_POSITIONS)).toHaveLength(ARDUINO_UNO_PINS.length)
    for (const pin of ARDUINO_UNO_PINS) {
      const pos = PIN_POSITIONS[pin.id]
      expect(pos).toEqual(pin.position)
      expect(pos).toHaveLength(3)
      expect(pos.every((n) => Number.isFinite(n))).toBe(true)
    }
  })

  it('builds a label lookup matching each pin', () => {
    for (const pin of ARDUINO_UNO_PINS) {
      expect(PIN_LABELS[pin.id]).toBe(pin.label)
    }
  })
})
