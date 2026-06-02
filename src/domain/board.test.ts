import { describe, it, expect } from 'vitest'
import {
  ARDUINO_UNO_PINS,
  BOARD_ID,
  PIN_POSITIONS,
  PIN_LABELS,
} from './board'

const ids = ARDUINO_UNO_PINS.map((p) => p.id)

describe('Arduino Uno board model', () => {
  it('includes all 14 digital pins D0..D13', () => {
    for (let n = 0; n <= 13; n++) {
      expect(ids).toContain(`${BOARD_ID}:D${n}`)
    }
    expect(ARDUINO_UNO_PINS.filter((p) => p.type === 'digital').length).toBeGreaterThanOrEqual(14)
  })

  it('includes all 6 analog pins A0..A5', () => {
    for (let n = 0; n <= 5; n++) {
      expect(ids).toContain(`${BOARD_ID}:A${n}`)
    }
    expect(ARDUINO_UNO_PINS.filter((p) => p.type === 'analog')).toHaveLength(6)
  })

  it('includes the key power and ground rails', () => {
    for (const key of ['5V', '3V3', 'VIN', 'GND1', 'GND2']) {
      expect(ids).toContain(`${BOARD_ID}:${key}`)
    }
    expect(ARDUINO_UNO_PINS.filter((p) => p.type === 'ground').length).toBeGreaterThanOrEqual(2)
  })

  it('marks PWM digital pins with a ~ in their label', () => {
    expect(PIN_LABELS[`${BOARD_ID}:D11`]).toBe('~D11')
    expect(PIN_LABELS[`${BOARD_ID}:D2`]).toBe('D2')
  })

  it('gives every pin a unique, namespaced id', () => {
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
