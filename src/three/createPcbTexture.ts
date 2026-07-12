import * as THREE from 'three'
import { ARDUINO_UNO_PINS, BOARD_SIZE } from '../domain/board'

const [BOARD_W, , BOARD_D] = BOARD_SIZE

/**
 * Procedurally draws a high-fidelity Arduino Uno top surface as a canvas
 * texture: the teal solder mask, white silkscreen (component outlines, group
 * labels, the Arduino wordmark/logo), gold header pads aligned to the real pin
 * coordinates, and copper traces.
 *
 * Generating it in code keeps the asset license-free and perfectly aligned with
 * the clickable pins in `domain/board.ts`. To swap in a real board photo later,
 * replace this with `new THREE.TextureLoader().load('/textures/uno-top.png')`.
 */
export function createPcbTexture(): THREE.CanvasTexture {
  const CW = 2048
  const CH = Math.round((CW * BOARD_D) / BOARD_W)
  const canvas = document.createElement('canvas')
  canvas.width = CW
  canvas.height = CH
  const ctx = canvas.getContext('2d')!

  // World (x,z) -> canvas (px,py). Canvas top (y=0) maps to world +Z.
  const px = (x: number) => ((x + BOARD_W / 2) / BOARD_W) * CW
  const py = (z: number) => ((BOARD_D / 2 - z) / BOARD_D) * CH
  const sx = (w: number) => (w / BOARD_W) * CW

  // ---- Solder mask (Arduino teal) with a subtle sheen + fine noise ----------
  const grad = ctx.createLinearGradient(0, 0, CW, CH)
  grad.addColorStop(0, '#00a1a8')
  grad.addColorStop(0.5, '#008a91')
  grad.addColorStop(1, '#00757b')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, CW, CH)

  ctx.save()
  ctx.globalAlpha = 0.05
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = i % 2 ? '#ffffff' : '#003a3d'
    ctx.fillRect(Math.floor((i * 97.13) % CW), Math.floor((i * 53.7) % CH), 2, 2)
  }
  ctx.restore()

  // ---- Copper traces (faint) ------------------------------------------------
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'
  ctx.lineWidth = 3
  for (let i = 0; i < 26; i++) {
    ctx.beginPath()
    const y = 40 + i * ((CH - 80) / 25)
    ctx.moveTo(60, y)
    ctx.lineTo(CW - 60, y + (i % 3 === 0 ? 26 : -20))
    ctx.stroke()
  }

  // ---- Silkscreen border + mounting holes -----------------------------------
  const white = 'rgba(255,255,255,0.82)'
  ctx.strokeStyle = white
  ctx.lineWidth = 4
  ctx.strokeRect(20, 20, CW - 40, CH - 40)

  const holes: [number, number][] = [
    [px(-BOARD_W / 2 + 0.22), py(BOARD_D / 2 - 0.22)],
    [px(BOARD_W / 2 - 0.22), py(BOARD_D / 2 - 0.22)],
    [px(-BOARD_W / 2 + 0.22), py(-BOARD_D / 2 + 0.22)],
    [px(BOARD_W / 2 - 0.22), py(-BOARD_D / 2 + 0.22)],
  ]
  for (const [hx, hy] of holes) {
    ctx.beginPath()
    ctx.arc(hx, hy, 30, 0, Math.PI * 2)
    ctx.fillStyle = '#d7dee4'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(hx, hy, 15, 0, Math.PI * 2)
    ctx.fillStyle = '#04494d'
    ctx.fill()
  }

  // ---- Component silkscreen outlines ---------------------------------------
  const outline = (
    x: number,
    z: number,
    w: number,
    d: number,
    fill?: string,
  ) => {
    const left = px(x - w / 2)
    const top = py(z + d / 2)
    const width = sx(w)
    const height = sx(d)
    if (fill) {
      ctx.fillStyle = fill
      ctx.fillRect(left, top, width, height)
    }
    ctx.strokeStyle = white
    ctx.lineWidth = 3
    ctx.strokeRect(left, top, width, height)
  }

  // ATmega328 IC footprint with a pin-1 marker.
  outline(0.35, 0.25, 1.05, 0.46)
  ctx.beginPath()
  ctx.arc(px(-0.1), py(0.4), 7, 0, Math.PI * 2)
  ctx.fillStyle = white
  ctx.fill()
  // 16 MHz crystal, voltage regulator, electrolytic caps.
  outline(-0.5, -0.2, 0.32, 0.18)
  outline(-1.05, 0.35, 0.5, 0.28)
  ctx.strokeStyle = white
  for (const cx of [-0.35, -0.05]) {
    ctx.beginPath()
    ctx.arc(px(cx), py(0.62), 22, 0, Math.PI * 2)
    ctx.stroke()
  }
  // ICSP 2x3 header pads (right of the IC).
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 3; c++) {
      ctx.beginPath()
      ctx.arc(px(1.25 + c * 0.12), py(0.15 - r * 0.12), 8, 0, Math.PI * 2)
      ctx.fillStyle = '#e9c46a'
      ctx.fill()
    }
  }

  // ---- Gold header pads under every clickable pin ---------------------------
  for (const pin of ARDUINO_UNO_PINS) {
    const [x, , z] = pin.position
    // Black header seat.
    ctx.fillStyle = '#111418'
    ctx.fillRect(px(x) - 22, py(z) - 22, 44, 44)
    // Gold ring + hole.
    ctx.beginPath()
    ctx.arc(px(x), py(z), 17, 0, Math.PI * 2)
    ctx.fillStyle = '#e9c46a'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(px(x), py(z), 7, 0, Math.PI * 2)
    ctx.fillStyle = '#1c1f24'
    ctx.fill()
  }

  // ---- Text (labels, group headers, branding) -------------------------------
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Per-pin numbers/labels just inside the board from each header.
  ctx.font = 'bold 26px Arial, sans-serif'
  for (const pin of ARDUINO_UNO_PINS) {
    const [x, , z] = pin.position
    const labelZ = z < 0 ? z + 0.17 : z - 0.17
    ctx.fillText(pin.label.replace('D', ''), px(x), py(labelZ))
  }

  ctx.font = 'bold 34px Arial, sans-serif'
  ctx.fillText('DIGITAL (PWM ~)', px(0.5), py(-BOARD_D / 2 + 0.05))
  ctx.fillText('POWER', px(-1.0), py(BOARD_D / 2 - 0.05))
  ctx.fillText('ANALOG IN', px(0.75), py(BOARD_D / 2 - 0.05))

  // Arduino infinity logo + wordmark.
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 10
  const lx = px(-0.2)
  const ly = py(-0.05)
  ctx.beginPath()
  ctx.arc(lx - 30, ly, 34, 0, Math.PI * 2)
  ctx.arc(lx + 30, ly, 34, 0, Math.PI * 2)
  ctx.stroke()
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.moveTo(lx - 46, ly)
  ctx.lineTo(lx - 14, ly)
  ctx.moveTo(lx + 14, ly)
  ctx.lineTo(lx + 46, ly)
  ctx.moveTo(lx + 30, ly - 16)
  ctx.lineTo(lx + 30, ly + 16)
  ctx.stroke()

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 60px Arial, sans-serif'
  ctx.fillText('ARDUINO', px(0.55), py(-0.05))
  ctx.font = 'italic bold 40px Arial, sans-serif'
  ctx.fillText('UNO', px(1.15), py(0.4))
  ctx.font = '20px Arial, sans-serif'
  ctx.fillText('MADE IN ITALY', px(0.55), py(-0.28))

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  texture.needsUpdate = true
  return texture
}
