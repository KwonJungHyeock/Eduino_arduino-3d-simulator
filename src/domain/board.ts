/**
 * Static description of the Arduino Uno (R3) board geometry used by the 3D
 * scene. Pin positions follow the real board's two-header layout so wiring and
 * sensor placement line up with the physical Arduino.
 *
 * All values are plain data (no Three.js objects) so this module stays trivially
 * testable and serialization-friendly. Coordinates are in world units with the
 * board centered on the X/Z plane; +Y is up.
 */

/** Functional category of a pin — drives default coloring and grouping. */
export type PinType = 'digital' | 'analog' | 'power' | 'ground'

export interface BoardPin {
  /** Globally unique, stable id, e.g. `"arduino-uno:D13"`. */
  id: string
  /** Short human label shown in the UI, e.g. `"D13"` or `"~D11"`. */
  label: string
  type: PinType
  /** [x, y, z] world position of the pin's clickable header. */
  position: [number, number, number]
}

/** Board id namespace; keeps pin ids unique across multiple boards later. */
export const BOARD_ID = 'arduino-uno'

/**
 * World-space dimensions of the PCB (x, y, z), keeping the real Uno's
 * ~68.6mm x 53.4mm aspect ratio.
 */
export const BOARD_SIZE: [number, number, number] = [3.4, 0.1, 2.6]

/** Top surface Y of the PCB (the board rests on the grid at y = 0). */
export const BOARD_TOP_Y = BOARD_SIZE[1]

/** Y of the clickable pin headers (standing above the black header strips). */
const PIN_Y = BOARD_TOP_Y + 0.06

/** Center-to-center spacing between adjacent header pins. */
const PIN_SPACING = 0.165

/** Z of the digital header (top edge) and power/analog header (bottom edge). */
const DIGITAL_Z = -BOARD_SIZE[2] / 2 + 0.22
const POWER_Z = BOARD_SIZE[2] / 2 - 0.22

/** A single position in a header row; `key === GAP` leaves an empty slot. */
interface Slot {
  /** Stable id suffix, or GAP for a spacer. */
  key: string
  label: string
  type: PinType
}

const GAP: Slot = { key: '__gap__', label: '', type: 'digital' }

const d = (n: number, pwm = false): Slot => ({
  key: `D${n}`,
  label: `${pwm ? '~' : ''}D${n}`,
  type: 'digital',
})

/**
 * Digital header (top edge), left (USB side) to right, matching the Uno R3:
 * D0..D7, a notch, then D8..D13, GND, AREF, SDA, SCL. PWM pins are marked `~`.
 */
const DIGITAL_ROW: Slot[] = [
  d(0),
  d(1),
  d(2),
  d(3, true),
  d(4),
  d(5, true),
  d(6, true),
  d(7),
  GAP,
  d(8),
  d(9, true),
  d(10, true),
  d(11, true),
  d(12),
  d(13),
  { key: 'GND_D', label: 'GND', type: 'ground' },
  { key: 'AREF', label: 'AREF', type: 'power' },
  { key: 'SDA', label: 'SDA', type: 'digital' },
  { key: 'SCL', label: 'SCL', type: 'digital' },
]

/**
 * Power + analog header (bottom edge), left to right:
 * IOREF, RESET, 3V3, 5V, GND, GND, VIN, a notch, then A0..A5.
 */
const POWER_ROW: Slot[] = [
  { key: 'IOREF', label: 'IOREF', type: 'power' },
  { key: 'RESET', label: 'RST', type: 'power' },
  { key: '3V3', label: '3V3', type: 'power' },
  { key: '5V', label: '5V', type: 'power' },
  { key: 'GND1', label: 'GND', type: 'ground' },
  { key: 'GND2', label: 'GND', type: 'ground' },
  { key: 'VIN', label: 'VIN', type: 'power' },
  GAP,
  { key: 'A0', label: 'A0', type: 'analog' },
  { key: 'A1', label: 'A1', type: 'analog' },
  { key: 'A2', label: 'A2', type: 'analog' },
  { key: 'A3', label: 'A3', type: 'analog' },
  { key: 'A4', label: 'A4', type: 'analog' },
  { key: 'A5', label: 'A5', type: 'analog' },
]

/** Lay out a header row centered on X at depth `z`, skipping GAP slots. */
function layoutRow(slots: Slot[], z: number): BoardPin[] {
  const startX = (-(slots.length - 1) / 2) * PIN_SPACING
  const pins: BoardPin[] = []
  slots.forEach((slot, i) => {
    if (slot.key === GAP.key) return
    pins.push({
      id: `${BOARD_ID}:${slot.key}`,
      label: slot.label,
      type: slot.type,
      position: [startX + i * PIN_SPACING, PIN_Y, z],
    })
  })
  return pins
}

/** Header strip placement metadata, consumed by the 3D board component. */
export const HEADER_ROWS = [
  { z: DIGITAL_Z, length: DIGITAL_ROW.length * PIN_SPACING + 0.1 },
  { z: POWER_Z, length: POWER_ROW.length * PIN_SPACING + 0.1 },
] as const

/** All clickable pins on the default Arduino Uno board. */
export const ARDUINO_UNO_PINS: BoardPin[] = [
  ...layoutRow(DIGITAL_ROW, DIGITAL_Z),
  ...layoutRow(POWER_ROW, POWER_Z),
]

/** Fast lookup: pinId -> [x, y, z] (used when rendering wires). */
export const PIN_POSITIONS: Record<string, [number, number, number]> =
  Object.fromEntries(ARDUINO_UNO_PINS.map((p) => [p.id, p.position]))

/** Fast lookup: pinId -> short label (used in the UI). */
export const PIN_LABELS: Record<string, string> = Object.fromEntries(
  ARDUINO_UNO_PINS.map((p) => [p.id, p.label]),
)
