import { useSimulatorStore } from '../store/useSimulatorStore'
import { PIN_LABELS } from '../domain/board'

/**
 * Floating control panel overlaid on top of the 3D canvas.
 *
 * Demonstrates the unidirectional data flow: UI reads from the store and
 * dispatches actions, while the 3D scene reacts to the same state.
 */
export default function Toolbar() {
  const isRunning = useSimulatorStore((s) => s.isRunning)
  const wires = useSimulatorStore((s) => s.wires)
  const pendingPinId = useSimulatorStore((s) => s.pendingPinId)
  const toggleSimulation = useSimulatorStore((s) => s.toggleSimulation)
  const clearWires = useSimulatorStore((s) => s.clearWires)

  const pendingLabel = pendingPinId
    ? (PIN_LABELS[pendingPinId] ?? pendingPinId)
    : null

  return (
    <div className="pointer-events-auto absolute left-4 top-4 z-10 flex w-60 flex-col gap-3 rounded-xl bg-slate-900/80 p-4 text-slate-100 shadow-lg backdrop-blur">
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

      {/* Wiring helper: explains the click-to-connect flow and shows progress. */}
      <div className="rounded-lg bg-slate-800/70 p-2 text-xs text-slate-300">
        <p className="font-medium text-slate-200">Wiring</p>
        {pendingLabel ? (
          <p>
            Connecting from{' '}
            <span className="font-semibold text-amber-400">{pendingLabel}</span>
            … click another pin.
          </p>
        ) : (
          <p>Click a pin to start a connection.</p>
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
