import * as THREE from 'three'
import {
  ARDUINO_UNO_PINS,
  BOARD_SIZE,
} from '../domain/board'

const [BOARD_W, , BOARD_D] = BOARD_SIZE

/**
 * Procedurally draws the Arduino Uno top silkscreen as a canvas texture.
 *
 * Generating it in code (rather than shipping a photo) keeps the asset
 * license-free and — crucially — perfectly aligned with the clickable pin
 * coordinates from `domain/board.ts`. To swap in a real board photo later,
 * replace this with a `TextureLoader().load('/textures/uno-top.png')`.
 */
export function createPcbTexture(): THREE.CanvasTexture {
  const CW = 1024
  const CH = Math.round((CW * BOARD_D) / BOARD_W)
  const canvas = document.createElement('canvas')
  canvas.width = CW
  canvas.height = CH
  const ctx = canvas.getContext('2d')!

  // World (x,z) -> canvas (px,py). Canvas top (y=0) maps to world +Z.
  const px = (x: number) => ((x + BOARD_W / 2) / BOARD_W) * CW
  const py = (z: number) => ((BOARD_D / 2 - z) / BOARD_D) * CH
  const sx = (w: number) => (w / BOARD_W) * CW // size along x

  // Base PCB color with a soft radial sheen.
  const grad = ctx.createLinearGradient(0, 0, CW, CH)
  grad.addColorStop(0, '#0c9aa1')
  grad.addColorStop(0.5, '#0b8c93')
  grad.addColorStop(1, '#097a80')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, CW, CH)

  // Inset silkscreen border.
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'
  ctx.lineWidth = 3
  ctx.strokeRect(14, 14, CW - 28, CH - 28)

  // Decorative copper traces for a printed-board feel.
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth = 2
  for (let i = 0; i < 14; i++) {
    ctx.beginPath()
    const y = 60 + i * ((CH - 120) / 13)
    ctx.moveTo(40, y)
    ctx.lineTo(CW - 40, y - (i % 2 === 0 ? 18 : -18))
    ctx.stroke()
  }

  // Mounting holes near the corners.
  const holes: [number, number][] = [
    [px(-BOARD_W / 2 + 0.2), py(BOARD_D / 2 - 0.2)],
    [px(BOARD_W / 2 - 0.2), py(BOARD_D / 2 - 0.2)],
    [px(-BOARD_W / 2 + 0.2), py(-BOARD_D / 2 + 0.2)],
    [px(BOARD_W / 2 - 0.2), py(-BOARD_D / 2 + 0.2)],
  ]
  for (const [hx, hy] of holes) {
    ctx.beginPath()
    ctx.arc(hx, hy, 16, 0, Math.PI * 2)
    ctx.fillStyle = '#cfd6dd'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(hx, hy, 8, 0, Math.PI * 2)
    ctx.fillStyle = '#06545a'
    ctx.fill()
  }

  // Silkscreen outline around each header row, derived from real pin extents.
  const drawHeaderOutline = (zs: number[], xs: number[]) => {
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const z = zs[0]
    const left = px(minX) - 18
    const top = py(z) - sx(0.16)
    const w = px(maxX) - px(minX) + 36
    const h = sx(0.32)
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'
    ctx.lineWidth = 2.5
    ctx.strokeRect(left, top, w, h)
  }

  const digital = ARDUINO_UNO_PINS.filter((p) => p.position[2] < 0)
  const power = ARDUINO_UNO_PINS.filter((p) => p.position[2] > 0)
  drawHeaderOutline(
    digital.map((p) => p.position[2]),
    digital.map((p) => p.position[0]),
  )
  drawHeaderOutline(
    power.map((p) => p.position[2]),
    power.map((p) => p.position[0]),
  )

  // Group labels in silkscreen white.
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  ctx.font = 'bold 26px Arial, sans-serif'
  ctx.fillText('DIGITAL (PWM ~)', px(0.45), py(-BOARD_D / 2 + 0.06))
  ctx.fillText('POWER', px(-1.0), py(BOARD_D / 2 - 0.06))
  ctx.fillText('ANALOG IN', px(0.7), py(BOARD_D / 2 - 0.06))

  // IC outline (ATmega328) silkscreen.
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'
  ctx.lineWidth = 2
  ctx.strokeRect(px(-0.15), py(0.45), sx(1.0), sx(0.5))

  // Branding.
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 64px Arial, sans-serif'
  ctx.fillText('ARDUINO', px(0.4), py(-0.05))
  ctx.font = 'italic bold 44px Arial, sans-serif'
  ctx.fillText('UNO', px(1.15), py(0.35))

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  texture.needsUpdate = true
  return texture
}
