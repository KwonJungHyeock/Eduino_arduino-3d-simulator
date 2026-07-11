import { useSimulatorStore } from '../store/useSimulatorStore'
import { PIN_LABELS } from '../domain/board'
import {
  COMPONENT_LIBRARY,
  COMPONENT_TYPES,
  collectComponentPins,
} from '../domain/components'

/**
 * Floating control panel overlaid on top of the 3D canvas.
 *
 * Demonstrates the unidirectional data flow: UI reads from the store and
 * dispatches actions, while the 3D scene reacts to the same state.
 */
export default function Toolbar() {
  const isRunning = useSimulatorStore((s) => s.isRunning)
  const wires = useSimulatorStore((s) => s.wires)
  const components = useSimulatorStore((s) => s.components)
  const pendingPinId = useSimulatorStore((s) => s.pendingPinId)
  const toggleSimulation = useSimulatorStore((s) => s.toggleSimulation)
  const clearWires = useSimulatorStore((s) => s.clearWires)
  const addComponent = useSimulatorStore((s) => s.addComponent)
  const removeComponent = useSimulatorStore((s) => s.removeComponent)

  // Resolve the pending pin label across both board and component pins.
  const componentLabels = collectComponentPins(components).labels
  const pendingLabel = pendingPinId
    ? (PIN_LABELS[pendingPinId] ?? componentLabels[pendingPinId] ?? pendingPinId)
    : null

  return (
    <div className="pointer-events-auto absolute left-4 top-4 z-10 flex max-h-[calc(100vh-2rem)] w-60 flex-col gap-3 overflow-y-auto rounded-xl bg-slate-900/80 p-4 text-slate-100 shadow-lg backdrop-blur">
      <div>
        <h1 className="text-lg font-semibold">3D Arduino Simulator</h1>
        <p className="text-xs text-slate-400">AIoT Sensor Simulation · MVP</p>
      </div>

      <button
        onClick={toggleSimulation}
        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
          isRunning
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-emerald-500 hover:bg-emerald-600'
        }`}
      >
        {isRunning ? '■ Stop Simulation' : '▶ Run Simulation'}
      </button>

      <div className="text-xs text-slate-400">
        <p>
          Status:{' '}
          <span className={isRunning ? 'text-emerald-400' : 'text-slate-300'}>
            {isRunning ? 'Running' : 'Idle'}
          </span>
        </p>
        <p>Wires: {wires.length}</p>
      </div>

      {/* Parts palette: click to add a component to the workspace. */}
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-medium text-slate-200">Components</p>
        <div className="grid grid-cols-2 gap-1.5">
          {COMPONENT_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => addComponent(type)}
              className="rounded-lg bg-slate-700 px-2 py-1.5 text-xs font-medium transition-colors hover:bg-sky-600"
            >
              + {COMPONENT_LIBRARY[type].label}
            </button>
          ))}
        </div>
      </div>

      {/* Placed components, each removable. */}
      {components.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-slate-200">
            Placed ({components.length})
          </p>
          {components.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded bg-slate-800/70 px-2 py-1 text-xs"
            >
              <span className="text-slate-300">
                {COMPONENT_LIBRARY[c.type].label} #{c.id.split('-').pop()}
              </span>
              <button
                onClick={() => removeComponent(c.id)}
                className="text-slate-400 transition-colors hover:text-red-400"
                aria-label={`Remove ${c.id}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Wiring helper: explains the click-to-connect flow and shows progress. */}
      <div className="rounded-lg bg-slate-800/70 p-2 text-xs text-slate-300">
        <p className="font-medium text-slate-200">Wiring</p>
        {pendingLabel ? (
          <p>
            <span className="font-semibold text-amber-400">{pendingLabel}</span>
            에서 다른 핀으로 연결하세요.
          </p>
        ) : (
          <p>핀을 잡고 다른 핀으로 <b>드래그</b>해서 연결! (탭-탭도 가능)</p>
        )}
      </div>

      <button
        onClick={clearWires}
        disabled={wires.length === 0}
        className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Clear Wires
      </button>
    </div>
  )
}
