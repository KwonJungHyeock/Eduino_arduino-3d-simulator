/**
 * Library of basic electronic components that can be placed in the workspace
 * and wired to the Arduino. Like the board model, this is plain serializable
 * data: a `PlacedComponent` (id + type + position) is what gets stored and
 * persisted; the visual/pin geometry is looked up from `COMPONENT_LIBRARY`.
 */

import type { PinType } from './board'

/** The kinds of basic parts available in the MVP palette. */
export type ComponentType = 'led' | 'resistor' | 'pushbutton' | 'potentiometer'

/** A connection point on a component, positioned relative to its origin. */
export interface ComponentPin {
  /** Short suffix, unique within the component (e.g. "anode"). */
  name: string
  label: string
  type: PinType
  /** [x, y, z] offset from the component's placed position. */
  offset: [number, number, number]
}

/** Static definition (geometry + pins) for one component type. */
export interface ComponentDef {
  type: ComponentType
  label: string
  /** Primary body color used by the 3D renderer. */
  color: string
  pins: ComponentPin[]
}

/** An instance of a component placed in the workspace (serializable). */
export interface PlacedComponent {
  /** Unique instance id, e.g. "led-1". */
  id: string
  type: ComponentType
  /** [x, y, z] world position of the component origin. */
  position: [number, number, number]
}

const PIN_Y = 0.12

export const COMPONENT_LIBRARY: Record<ComponentType, ComponentDef> = {
  led: {
    type: 'led',
    label: 'LED',
    color: '#ef4444',
    pins: [
      { name: 'anode', label: '+', type: 'digital', offset: [0.12, PIN_Y, 0] },
      { name: 'cathode', label: '-', type: 'ground', offset: [-0.12, PIN_Y, 0] },
    ],
  },
  resistor: {
    type: 'resistor',
    label: 'Resistor',
    color: '#d9b382',
    pins: [
      { name: 'a', label: '1', type: 'digital', offset: [0.32, PIN_Y, 0] },
      { name: 'b', label: '2', type: 'digital', offset: [-0.32, PIN_Y, 0] },
    ],
  },
  pushbutton: {
    type: 'pushbutton',
    label: 'Button',
    color: '#334155',
    pins: [
      { name: '1a', label: '1', type: 'digital', offset: [0.22, PIN_Y, 0.16] },
      { name: '2a', label: '2', type: 'digital', offset: [-0.22, PIN_Y, 0.16] },
      { name: '1b', label: '3', type: 'digital', offset: [0.22, PIN_Y, -0.16] },
      { name: '2b', label: '4', type: 'digital', offset: [-0.22, PIN_Y, -0.16] },
    ],
  },
  potentiometer: {
    type: 'potentiometer',
    label: 'Potentiometer',
    color: '#1e3a8a',
    pins: [
      { name: 'gnd', label: 'G', type: 'ground', offset: [-0.26, PIN_Y, 0.22] },
      { name: 'wiper', label: 'W', type: 'analog', offset: [0, PIN_Y, 0.22] },
      { name: 'vcc', label: 'V', type: 'power', offset: [0.26, PIN_Y, 0.22] },
    ],
  },
}

/** Ordered list for rendering the palette UI. */
export const COMPONENT_TYPES: ComponentType[] = [
  'led',
  'resistor',
  'pushbutton',
  'potentiometer',
]

/** Build the global pin id for a placed component pin, e.g. "led-1:anode". */
export function componentPinId(componentId: string, pinName: string): string {
  return `${componentId}:${pinName}`
}

/** Absolute world position of a placed component's pin. */
export function componentPinPosition(
  placed: PlacedComponent,
  pin: ComponentPin,
): [number, number, number] {
  return [
    placed.position[0] + pin.offset[0],
    placed.position[1] + pin.offset[1],
    placed.position[2] + pin.offset[2],
  ]
}

/**
 * Build a lookup of every component pin's world position and label, used when
 * rendering wires and resolving pin clicks across components.
 */
export function collectComponentPins(components: PlacedComponent[]): {
  positions: Record<string, [number, number, number]>
  labels: Record<string, string>
} {
  const positions: Record<string, [number, number, number]> = {}
  const labels: Record<string, string> = {}
  for (const placed of components) {
    const def = COMPONENT_LIBRARY[placed.type]
    for (const pin of def.pins) {
      const id = componentPinId(placed.id, pin.name)
      positions[id] = componentPinPosition(placed, pin)
      labels[id] = `${def.label} ${pin.label}`
    }
  }
  return { positions, labels }
}
