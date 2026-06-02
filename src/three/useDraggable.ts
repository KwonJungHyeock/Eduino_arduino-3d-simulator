import { useRef } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { useSimulatorStore } from '../store/useSimulatorStore'
import type { Vec3 } from '../store/useSimulatorStore'

/**
 * Makes an object draggable across the horizontal (XZ) ground plane.
 *
 * Returns pointer handlers to spread onto a mesh. The object's Y is preserved;
 * only X/Z change. While dragging, the global `isDragging` flag is set so the
 * camera's OrbitControls can be temporarily disabled.
 *
 * Pins should call `stopPropagation` on pointer-down so clicking a pin wires it
 * instead of starting a drag.
 */
export function useDraggable(
  position: Vec3,
  onChange: (position: Vec3) => void,
) {
  const setDragging = useSimulatorStore((s) => s.setDragging)
  const grabOffset = useRef<THREE.Vector3 | null>(null)
  const plane = useRef(new THREE.Plane())
  const hit = useRef(new THREE.Vector3())

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    // Drag plane is horizontal, passing through the object's current height.
    plane.current.setFromNormalAndCoplanarPoint(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(position[0], position[1], position[2]),
    )
    const point = e.ray.intersectPlane(plane.current, hit.current)
    grabOffset.current = point
      ? new THREE.Vector3(position[0], 0, position[2]).sub(
          new THREE.Vector3(point.x, 0, point.z),
        )
      : new THREE.Vector3()
    setDragging(true)
    document.body.style.cursor = 'grabbing'
  }

  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!grabOffset.current) return
    e.stopPropagation()
    const point = e.ray.intersectPlane(plane.current, hit.current)
    if (!point) return
    onChange([
      point.x + grabOffset.current.x,
      position[1],
      point.z + grabOffset.current.z,
    ])
  }

  const end = (e: ThreeEvent<PointerEvent>) => {
    if (!grabOffset.current) return
    e.stopPropagation()
    ;(e.target as Element).releasePointerCapture?.(e.pointerId)
    grabOffset.current = null
    setDragging(false)
    document.body.style.cursor = 'auto'
  }

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: end,
    onPointerCancel: end,
  }
}
