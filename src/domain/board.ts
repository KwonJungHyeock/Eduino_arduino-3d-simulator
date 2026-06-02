/**
 * Static description of the Arduino Uno board geometry used by the 3D scene.
 *
 * Pin positions are expressed in world units relative to the board centered at
 * the origin. They are plain data (no Three.js objects) so this module stays
 * trivially testable and serialization-friendly.
 */

/** Functional category of a pin — drives default coloring and grouping. */
export type PinType = 'digital' | 'analog' | 'power' | 'ground'

export interface BoardPin {
  /** Globally unique, stable id, e.g. `"arduino-uno:D13"`. */
  id: string
  /** Short human label shown in the UI, e.g. `"D13"`. */
  label: string
  type: PinType
  /** [x, y, z] world position of the pin's clickable header. */
  position: [number, number, number]
}

/** Board id namespace; keeps pin ids unique across multiple boards later. */
export const BOARD_ID = 'arduino-uno'

/** World-space dimensions of the board base (x, y, z). */
export const BOARD_SIZE: [number, number, number] = [3, 0.2, 2]

/** Y position of the pin headers (sitting just above the board surface). */
const PIN_Y = 0.22

/** Spread `count` x-positions evenly across the [x0, x1] range. */
function spreadX(count: number, x0: number, x1: number): number[] {
  if (count === 1) return [(x0 + x1) / 2]
  const step = (x1 - x0) / (count - 1)
  return Array.from({ length: count }, (_, i) => x0 + i * step)
}

function makePin(
  label: string,
  type: PinType,
  x: number,
  z: number,
): BoardPin {
  return { id: `${BOARD_ID}:${label}`, label, type, position: [x, PIN_Y, z] }
}

// Digital pins D0..D13 along the back edge.
const DIGITAL_LABELS = Array.from({ length: 14 }, (_, i) => `D${i}`)
const digitalPins = spreadX(DIGITAL_LABELS.length, -1.3, 1.3).map((x, i) =>
  makePin(DIGITAL_LABELS[i], 'digital', x, -0.9),
)

// Analog input pins A0..A5 along the right half of the front edge.
const ANALOG_LABELS = Array.from({ length: 6 }, (_, i) => `A${i}`)
const analogPins = spreadX(ANALOG_LABELS.length, 0.35, 1.3).map((x, i) =>
  makePin(ANALOG_LABELS[i], 'analog', x, 0.9),
)

// Power / ground rail along the left half of the front edge.
const powerPins: BoardPin[] = spreadX(6, -1.3, -0.35).map((x, i) => {
  const label = ['VIN', 'GND', 'GND2', '5V', '3V3', 'RST'][i]
  const type: PinType = label.startsWith('GND') ? 'ground' : 'power'
  return makePin(label, type, x, 0.9)
})

/** All clickable pins on the default Arduino Uno board. */
export const ARDUINO_UNO_PINS: BoardPin[] = [
  ...digitalPins,
  ...analogPins,
  ...powerPins,
]

/** Fast lookup: pinId -> [x, y, z] (used when rendering wires). */
export const PIN_POSITIONS: Record<string, [number, number, number]> =
  Object.fromEntries(ARDUINO_UNO_PINS.map((p) => [p.id, p.position]))

/** Fast lookup: pinId -> short label (used in the UI). */
export const PIN_LABELS: Record<string, string> = Object.fromEntries(
  ARDUINO_UNO_PINS.map((p) => [p.id, p.label]),
)
