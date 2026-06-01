import { useSimulatorStore } from '../store/useSimulatorStore'

/**
 * Floating control panel overlaid on top of the 3D canvas.
 *
 * Demonstrates the unidirectional data flow: UI reads from the store and
 * dispatches actions, while the 3D scene reacts to the same state.
 */
export default function Toolbar() {
  const isRunning = useSimulatorStore((s) => s.isRunning)
  const wires = useSimulatorStore((s) => s.wires)
  const toggleSimulation = useSimulatorStore((s) => s.toggleSimulation)

  return (
    <div className="pointer-events-auto absolute left-4 top-4 z-10 flex flex-col gap-3 rounded-xl bg-slate-900/80 p-4 text-slate-100 shadow-lg backdrop-blur">
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
    </div>
  )
}
