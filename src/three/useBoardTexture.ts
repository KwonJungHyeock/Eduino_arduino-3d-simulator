import { useEffect, useState } from 'react'
import * as THREE from 'three'
import { createPcbTexture } from './createPcbTexture'

/** Public path a real top-down board photo can be dropped at to override the art. */
const PHOTO_PATH = '/textures/uno-top.png'

/**
 * Returns the board's top-surface texture.
 *
 * Starts with the procedural silkscreen, then—if a real photo exists at
 * `public/textures/uno-top.png`—swaps to it automatically. Drop in a
 * (licensed) top-down Uno photo and it is used with zero code changes; if the
 * file is absent the procedural art stays.
 */
export function useBoardTexture(): THREE.Texture {
  const [texture, setTexture] = useState<THREE.Texture>(() =>
    createPcbTexture(),
  )

  useEffect(() => {
    let active = true
    const loader = new THREE.TextureLoader()
    loader.load(
      PHOTO_PATH,
      (photo) => {
        if (!active) return
        photo.colorSpace = THREE.SRGBColorSpace
        photo.anisotropy = 8
        setTexture((prev) => {
          prev.dispose()
          return photo
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

  useEffect(() => () => texture.dispose(), [texture])

  return texture
}
