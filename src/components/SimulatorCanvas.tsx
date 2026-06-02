import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Environment } from '@react-three/drei'
import { useSimulatorStore } from '../store/useSimulatorStore'
import ArduinoBoard from './ArduinoBoard'
import Components from './Components'
import Wires from './Wires'

/**
 * The 3D workspace. All heavy rendering runs on the client GPU via Three.js,
 * keeping AWS infrastructure costs minimal (no server-side rendering).
 *
 * Clicking empty space (a pointer miss) cancels any in-progress wiring.
 */
export default function SimulatorCanvas() {
  const clearSelection = useSimulatorStore((s) => s.clearSelection)
  const isDragging = useSimulatorStore((s) => s.isDragging)

  return (
    <Canvas
      shadows
      camera={{ position: [4, 4, 6], fov: 50 }}
      className="h-full w-full"
      onPointerMissed={() => clearSelection()}
    >
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />

      <ArduinoBoard />
      <Components />
      <Wires />

      <Grid
        args={[20, 20]}
        cellColor="#3a3a3a"
        sectionColor="#555555"
        infiniteGrid
        fadeDistance={30}
      />

      <Environment preset="city" />
      {/* Disable camera orbit while dragging an object. */}
      <OrbitControls makeDefault enableDamping enabled={!isDragging} />
    </Canvas>
  )
}
