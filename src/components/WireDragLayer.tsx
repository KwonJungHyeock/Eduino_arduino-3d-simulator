import { useEffect, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { useSimulatorStore } from '../store/useSimulatorStore'
import { usePinPositions } from '../hooks/usePinPositions'

/**
 * Draws a live "rubber-band" wire from the pin a drag started on to the
 * pointer, so learners can see the connection they are making. The pointer is
 * projected onto a horizontal plane at the source pin's height, tracked via a
 * DOM listener so it follows the cursor even over other objects.
 */
export default function WireDragLayer() {
  const dragSource = useSimulatorStore((s) => s.dragSource)
  const setDragSource = useSimulatorStore((s) => s.setDragSource)
  const positions = usePinPositions()
  const { camera, gl } = useThree()
  const [end, setEnd] = useState<[number, number, number] | null>(null)

  const start = dragSource ? positions[dragSource] : undefined

  useEffect(() => {
    if (!dragSource || !start) return
    const dom = gl.domElement
    const ray = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -start[1])
    const hit = new THREE.Vector3()

    const onMove = (ev: PointerEvent) => {
      const rect = dom.getBoundingClientRect()
      ndc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1
      ndc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1
      ray.setFromCamera(ndc, camera)
      if (ray.ray.intersectPlane(plane, hit)) setEnd([hit.x, hit.y, hit.z])
    }
    // Releasing anywhere ends the gesture (pin handlers connect first on bubble).
    const onUp = () => setDragSource(null)

    dom.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      dom.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      setEnd(null)
    }
  }, [dragSource, start, camera, gl, setDragSource])

  if (!start || !end) return null
  return <Line points={[start, end]} color="#38bdf8" lineWidth={3} />
}
