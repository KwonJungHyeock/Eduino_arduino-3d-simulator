import type { Wire } from '../store/useSimulatorStore'
import type { PlacedComponent } from './components'

/**
 * Guided-lesson model for the LMS. A lesson pre-places its components, then
 * walks the learner through button-driven steps — including "wiring" steps
 * where they make the real connections in 3D, checked live against the store.
 *
 * Pure data + pure check helpers so the same content can be authored, stored
 * (DynamoDB), and validated on the client without a backend.
 */

/**
 * A required connection between two pins. Each side lists acceptable pin ids
 * (e.g. any GND pin satisfies the ground side), matched order-independently.
 */
export interface LessonConnection {
  label: string
  from: string[]
  to: string[]
}

export type LessonStepKind = 'info' | 'wiring' | 'simulate'

export interface LessonStep {
  id: string
  kind: LessonStepKind
  title: string
  body: string
  /** For `wiring` steps: the connections the learner must make. */
  requiredConnections?: LessonConnection[]
  /** For `simulate` steps: component ids expected to be lit on success. */
  expectLedOn?: string[]
}

export interface Lesson {
  id: string
  title: string
  /** Components placed when the lesson starts (fixed ids for step checks). */
  setup: PlacedComponent[]
  steps: LessonStep[]
}

/** A wire satisfies a connection if it joins the two accepted pin sets. */
export function connectionSatisfied(
  conn: LessonConnection,
  wires: Wire[],
): boolean {
  return wires.some(
    (w) =>
      (conn.from.includes(w.startPinId) && conn.to.includes(w.endPinId)) ||
      (conn.from.includes(w.endPinId) && conn.to.includes(w.startPinId)),
  )
}

/** Whether every requirement of a step is met (info/simulate are always ok). */
export function stepComplete(step: LessonStep, wires: Wire[]): boolean {
  if (step.kind !== 'wiring' || !step.requiredConnections) return true
  return step.requiredConnections.every((c) => connectionSatisfied(c, wires))
}

const GND_PINS = ['arduino-uno:GND_D', 'arduino-uno:GND1', 'arduino-uno:GND2']

/** Starter lesson: light an LED from 5V through a current-limiting resistor. */
export const LED_LESSON: Lesson = {
  id: 'led-on',
  title: 'LED 켜기',
  setup: [
    { id: 'lesson-r', type: 'resistor', position: [-0.7, 0.12, 2.2] },
    { id: 'lesson-led', type: 'led', position: [0.7, 0.12, 2.2] },
  ],
  steps: [
    {
      id: 'intro',
      kind: 'info',
      title: '준비',
      body: '5V · 저항 · LED · GND로 LED를 켜봅니다. 핀을 클릭해 아래 순서대로 결선하세요. (핀 클릭 → 다른 핀 클릭)',
    },
    {
      id: 'wire-5v-r',
      kind: 'wiring',
      title: '① 5V → 저항',
      body: '보드의 5V 핀과 저항의 한쪽 다리를 연결하세요.',
      requiredConnections: [
        { label: '5V ↔ 저항', from: ['arduino-uno:5V'], to: ['lesson-r:a', 'lesson-r:b'] },
      ],
    },
    {
      id: 'wire-r-led',
      kind: 'wiring',
      title: '② 저항 → LED(+)',
      body: '저항의 반대쪽 다리와 LED의 +(애노드)를 연결하세요.',
      requiredConnections: [
        { label: '저항 ↔ LED +', from: ['lesson-r:a', 'lesson-r:b'], to: ['lesson-led:anode'] },
      ],
    },
    {
      id: 'wire-led-gnd',
      kind: 'wiring',
      title: '③ LED(−) → GND',
      body: 'LED의 −(캐소드)와 보드의 GND 핀을 연결하세요.',
      requiredConnections: [
        { label: 'LED − ↔ GND', from: ['lesson-led:cathode'], to: GND_PINS },
      ],
    },
    {
      id: 'run',
      kind: 'simulate',
      title: '④ 실행',
      body: '▶ 실행을 누르면 회로에 전류가 흘러 LED에 불이 들어옵니다!',
      expectLedOn: ['lesson-led'],
    },
  ],
}

export const LESSONS: Lesson[] = [LED_LESSON]
