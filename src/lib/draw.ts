// Renders the 21-point hand skeleton onto a 2D canvas. Successor to the old
// components/Draw.js, adapted for MediaPipe's normalized [0..1] landmarks
// (the old handpose model emitted pixel coordinates).
import type { Landmark } from '@/game/gestures'

// MediaPipe Hands connection map (bone -> bone).
const HAND_CONNECTIONS: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4], // thumb
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8], // index
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12], // middle
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16], // ring
  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20], // pinky
  [0, 17], // palm base
]

export interface DrawOptions {
  stroke?: string
  point?: string
  glow?: string
}

const DEFAULTS: Required<DrawOptions> = {
  stroke: 'rgba(34, 211, 238, 0.85)', // cyan bones
  point: '#f5d90a', // accent joints
  glow: 'rgba(34, 211, 238, 0.6)',
}

/**
 * Clears the canvas and draws the skeleton. Coordinates are normalized, so they
 * are scaled by the canvas size; the canvas element itself is CSS-mirrored to
 * match the mirrored video feed, so no horizontal flip is needed here.
 */
export function drawLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[] | null | undefined,
  options: DrawOptions = {},
): void {
  const { stroke, point, glow } = { ...DEFAULTS, ...options }
  const { width, height } = ctx.canvas
  ctx.clearRect(0, 0, width, height)
  if (!landmarks || landmarks.length < 21) return

  const px = (i: number) => landmarks[i].x * width
  const py = (i: number) => landmarks[i].y * height

  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.shadowColor = glow
  ctx.shadowBlur = 12

  // Bones
  ctx.strokeStyle = stroke
  ctx.lineWidth = Math.max(3, width * 0.006)
  ctx.beginPath()
  for (const [a, b] of HAND_CONNECTIONS) {
    ctx.moveTo(px(a), py(a))
    ctx.lineTo(px(b), py(b))
  }
  ctx.stroke()

  // Joints
  ctx.fillStyle = point
  const r = Math.max(3, width * 0.008)
  for (let i = 0; i < landmarks.length; i++) {
    ctx.beginPath()
    ctx.arc(px(i), py(i), r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}
