import type { Wire } from '../store/useSimulatorStore'
import type { PlacedComponent } from './components'

/**
 * A tiny, Tinkercad-style connectivity simulator.
 *
 * It is deliberately NOT a full analog (SPICE) solver — it models the circuit
 * as nets joined by wires, lets current flow through two-terminal passthrough
 * parts (resistors), and decides whether each LED is lit by checking that its
 * anode can reach a HIGH source and its cathode can reach ground.
 *
 * Pure and dependency-free so it can be unit-tested and, later, run unchanged
 * inside an AWS-hosted client bundle.
 */

const BOARD = 'arduino-uno:'
const HIGH_KEYS = new Set(['5V', '3V3', 'VIN'])
const GND_KEYS = new Set(['GND_D', 'GND1', 'GND2'])

function boardKey(pinId: string): string | null {
  return pinId.startsWith(BOARD) ? pinId.slice(BOARD.length) : null
}

/** Union-find over pin ids to group wired pins into electrical nets. */
class Nets {
  private parent = new Map<string, string>()

  private root(x: string): string {
    const parent = this.parent
    if (!parent.has(x)) {
      parent.set(x, x)
      return x
    }
    // Find the representative.
    let r = x
    while (parent.get(r)! !== r) r = parent.get(r)!
    // Path-compress everything on the way to it.
    let cur = x
    while (cur !== r) {
      const next = parent.get(cur)!
      parent.set(cur, r)
      cur = next
    }
    return r
  }

  union(a: string, b: string): void {
    const ra = this.root(a)
    const rb = this.root(b)
    if (ra !== rb) this.parent.set(ra, rb)
  }

  net(x: string): string {
    return this.root(x)
  }
}

export interface SimInput {
  wires: Wire[]
  components: PlacedComponent[]
  /** Pin states driven by the sketch/lesson; HIGH pins act as sources. */
  pinStates?: Record<string, 'HIGH' | 'LOW'>
}

export interface SimResult {
  /** componentId -> whether the LED is lit. */
  ledOn: Record<string, boolean>
  /** Pin ids currently at a HIGH potential (for visual feedback). */
  highPins: string[]
  /** Human-readable issues (e.g. a direct short). */
  warnings: string[]
}

export const EMPTY_SIM: SimResult = { ledOn: {}, highPins: [], warnings: [] }

/** Breadth-first reachable set over undirected conduction edges. */
function reachable(seeds: Set<string>, edges: [string, string][]): Set<string> {
  const adj = new Map<string, string[]>()
  for (const [a, b] of edges) {
    ;(adj.get(a) ?? adj.set(a, []).get(a)!).push(b)
    ;(adj.get(b) ?? adj.set(b, []).get(b)!).push(a)
  }
  const seen = new Set(seeds)
  const queue = [...seeds]
  while (queue.length) {
    const n = queue.shift()!
    for (const m of adj.get(n) ?? []) {
      if (!seen.has(m)) {
        seen.add(m)
        queue.push(m)
      }
    }
  }
  return seen
}

/** Evaluate the circuit and report which LEDs are lit. */
export function simulate(input: SimInput): SimResult {
  const { wires, components, pinStates = {} } = input
  const nets = new Nets()

  // 1) Wires merge their two pins into the same net.
  const endpoints = new Set<string>()
  for (const w of wires) {
    nets.union(w.startPinId, w.endPinId)
    endpoints.add(w.startPinId)
    endpoints.add(w.endPinId)
  }

  // 2) Passthrough parts add conduction edges between their pin nets.
  const edges: [string, string][] = []
  for (const c of components) {
    if (c.type === 'resistor') {
      edges.push([nets.net(`${c.id}:a`), nets.net(`${c.id}:b`)])
    }
  }

  // 3) Identify HIGH sources and grounds from the wired endpoints.
  const highSeeds = new Set<string>()
  const gndSeeds = new Set<string>()
  for (const pin of endpoints) {
    const key = boardKey(pin)
    if (key && HIGH_KEYS.has(key)) highSeeds.add(nets.net(pin))
    if (key && GND_KEYS.has(key)) gndSeeds.add(nets.net(pin))
    if (pinStates[pin] === 'HIGH') highSeeds.add(nets.net(pin))
  }

  const highNets = reachable(highSeeds, edges)
  const gndNets = reachable(gndSeeds, edges)

  // 4) An LED lights when its anode is HIGH and its cathode reaches ground.
  const ledOn: Record<string, boolean> = {}
  for (const c of components) {
    if (c.type !== 'led') continue
    const anode = nets.net(`${c.id}:anode`)
    const cathode = nets.net(`${c.id}:cathode`)
    ledOn[c.id] = highNets.has(anode) && gndNets.has(cathode)
  }

  // 5) Pins sitting on a HIGH net, for board/pin visual feedback.
  const highPins: string[] = []
  for (const pin of endpoints) {
    if (highNets.has(nets.net(pin))) highPins.push(pin)
  }

  // 6) Basic short detection: a net that is both a HIGH source and ground.
  const warnings: string[] = []
  for (const seed of highSeeds) {
    if (gndNets.has(seed)) {
      warnings.push('Short circuit: a power pin is connected directly to GND.')
      break
    }
  }

  return { ledOn, highPins, warnings }
}
