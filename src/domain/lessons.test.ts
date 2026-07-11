import { describe, it, expect } from 'vitest'
import {
  LED_LESSON,
  connectionSatisfied,
  stepComplete,
  type LessonConnection,
} from './lessons'
import type { Wire } from '../store/useSimulatorStore'

let seq = 0
const wire = (a: string, b: string): Wire => ({
  id: `w${seq++}`,
  startPinId: a,
  endPinId: b,
  color: '#fff',
})

describe('connectionSatisfied', () => {
  const conn: LessonConnection = {
    label: 'LED − ↔ GND',
    from: ['lesson-led:cathode'],
    to: ['arduino-uno:GND1', 'arduino-uno:GND2'],
  }

  it('matches regardless of wire direction', () => {
    expect(connectionSatisfied(conn, [wire('lesson-led:cathode', 'arduino-uno:GND1')])).toBe(true)
    expect(connectionSatisfied(conn, [wire('arduino-uno:GND2', 'lesson-led:cathode')])).toBe(true)
  })

  it('accepts any pin in the target set (either GND)', () => {
    expect(connectionSatisfied(conn, [wire('lesson-led:cathode', 'arduino-uno:GND2')])).toBe(true)
  })

  it('rejects an unrelated wire', () => {
    expect(connectionSatisfied(conn, [wire('lesson-led:cathode', 'arduino-uno:5V')])).toBe(false)
  })
})

describe('stepComplete', () => {
  it('is always true for info and simulate steps', () => {
    const info = LED_LESSON.steps.find((s) => s.kind === 'info')!
    const sim = LED_LESSON.steps.find((s) => s.kind === 'simulate')!
    expect(stepComplete(info, [])).toBe(true)
    expect(stepComplete(sim, [])).toBe(true)
  })

  it('requires the wiring to be present for wiring steps', () => {
    const step = LED_LESSON.steps.find((s) => s.id === 'wire-5v-r')!
    expect(stepComplete(step, [])).toBe(false)
    expect(stepComplete(step, [wire('arduino-uno:5V', 'lesson-r:a')])).toBe(true)
  })
})

describe('LED_LESSON content', () => {
  it('places a resistor and an LED with stable ids', () => {
    const ids = LED_LESSON.setup.map((c) => c.id)
    expect(ids).toContain('lesson-r')
    expect(ids).toContain('lesson-led')
  })

  it('ends on a simulate step that expects the LED lit', () => {
    const last = LED_LESSON.steps[LED_LESSON.steps.length - 1]
    expect(last.kind).toBe('simulate')
    expect(last.expectLedOn).toContain('lesson-led')
  })
})
