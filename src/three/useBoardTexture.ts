import { useEffect, useState } from 'react'
import * as THREE from 'three'
import { createPcbTexture } from './createPcbTexture'

/** Public path a real top-down board photo can be dropped at to override the art. */
const PHOTO_PATH = '/textures/uno-top.png'

/**
 * Orientation of the photo relative to the 3D board. If the photo appears
 * rotated/mirrored versus the pins, flip these (they're the only knobs needed).
 */
const PHOTO_FLIP_Y = false // false → image top maps to the board's digital edge

export interface BoardTexture {
  texture: THREE.Texture
  /** True once a real board photo has loaded (procedural art is hidden then). */
  isPhoto: boolean
}

/**
 * Returns the board's top-surface texture.
 *
 * Starts with the procedural silkscreen, then—if a real photo exists at
 * `public/textures/uno-top.png`—swaps to it automatically and reports
 * `isPhoto`, so the board can hide its procedural 3D fixtures (the photo
 * already shows the USB/jack/IC/etc.).
 */
export function useBoardTexture(): BoardTexture {
  const [state, setState] = useState<BoardTexture>(() => ({
    texture: createPcbTexture(),
    isPhoto: false,
  }))

  useEffect(() => {
    let active = true
    const loader = new THREE.TextureLoader()
    loader.load(
      PHOTO_PATH,
      (photo) => {
        if (!active) return
        photo.colorSpace = THREE.SRGBColorSpace
        photo.anisotropy = 8
        photo.flipY = PHOTO_FLIP_Y
        photo.needsUpdate = true
        setState((prev) => {
          prev.texture.dispose()
          return { texture: photo, isPhoto: true }
        })
      },
      undefined,
      () => {
        /* No photo present — keep the procedural texture. */
      },
    )
    return () => {
      active = false
    }
  }, [])

  useEffect(() => () => state.texture.dispose(), [state.texture])

  return state
}
