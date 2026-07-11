import { useState } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { useSimulatorStore } from '../store/useSimulatorStore'

/**
 * Shared pin interaction for both board and component pins.
 *
 * Supports two ways to wire, so it works for young learners and power users:
 *  - **Drag**: press one pin, drag to another, release → wire created.
 *  - **Tap**: click a pin then click another → wire created (click-to-connect).
 *
 * Returns a `hovered` flag plus handlers to spread onto the pin's hit mesh.
 */
export function usePinConnect(pinId: string) {
  const [hovered, setHovered] = useState(false)
  const setDragSource = useSimulatorStore((s) => s.setDragSource)
  const connectPins = useSimulatorStore((s) => s.connectPins)
  const selectPin = useSimulatorStore((s) => s.selectPin)

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setDragSource(pinId)
  }

  const onPointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    const src = useSimulatorStore.getState().dragSource
    if (src && src !== pinId) {
      connectPins(src, pinId) // dragged from another pin → connect
    } else {
      selectPin(pinId) // tap on the same pin → click-to-connect flow
    }
    setDragSource(null)
  }

  const onPointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHovered(true)
    document.body.style.cursor = 'crosshair'
  }

  const onPointerOut = () => {
    setHovered(false)
    document.body.style.cursor = 'auto'
  }

  return {
    hovered,
    handlers: { onPointerDown, onPointerUp, onPointerOver, onPointerOut },
  }
}
