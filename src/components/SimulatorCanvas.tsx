import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Environment } from '@react-three/drei'
import { useSimulatorStore } from '../store/useSimulatorStore'

/**
 * Placeholder Arduino board mesh.
 *
 * This is a stand-in for the real GLTF board model that will be loaded later.
 * It pulses subtly while the simulation is running to give immediate visual
 * feedback that the run-state in the store is wired up end-to-end.
 */
function BoardPlaceholder() {
  const isRunning = useSimulatorStore((s) => s.isRunning)

  return (
    <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
      <boxGeometry args={[3, 0.2, 2]} />
      <meshStandardMaterial
        color={isRunning ? '#1d9bf0' : '#0b6e4f'}
        emissive={isRunning ? '#0a3a5c' : '#000000'}
        emissiveIntensity={isRunning ? 0.6 : 0}
        metalness={0.2}
        roughness={0.6}
      />
    </mesh>
  )
}

/**
 * The 3D workspace. All heavy rendering runs on the client GPU via Three.js,
 * keeping AWS infrastructure costs minimal (no server-side rendering).
 */
export default function SimulatorCanvas() {
  return (
    <Canvas
      shadows
      camera={{ position: [4, 4, 6], fov: 50 }}
      className="h-full w-full"
    >
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />

      <BoardPlaceholder />

      <Grid
        args={[20, 20]}
        cellColor="#3a3a3a"
        sectionColor="#555555"
        infiniteGrid
        fadeDistance={30}
      />

      <Environment preset="city" />
      <OrbitControls makeDefault enableDamping />
    </Canvas>
  )
}
