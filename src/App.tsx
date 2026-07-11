import SimulatorCanvas from './components/SimulatorCanvas'
import Toolbar from './components/Toolbar'
import LessonPanel from './components/LessonPanel'

/**
 * Application shell.
 *
 * A single full-viewport workspace: the 3D simulator canvas fills the screen
 * and UI panels are overlaid on top. As the LMS features land, this shell will
 * host routing (lessons, editor, dashboard) around the canvas.
 */
function App() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950">
      <Toolbar />
      <LessonPanel />
      <SimulatorCanvas />
    </div>
  )
}

export default App
