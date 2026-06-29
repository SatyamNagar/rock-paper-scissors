// Maps MediaPipe output to a Rock/Paper/Scissors move.
//
// Two signals, in priority order:
//   1. The GestureRecognizer's built-in classification. Its canned categories
//      map cleanly: Closed_Fist -> rock, Open_Palm -> paper, Victory -> scissors.
//   2. A geometry fallback that counts extended fingers from the 21 hand
//      landmarks — used when the canned label is absent or low-confidence
//      (e.g. the model reports Pointing_Up / ILoveYou but the hand is clearly
//      a scissors/paper shape).
//
// Kept free of MediaPipe imports so it is trivially unit-testable with plain
// landmark arrays.
import type { Move } from './types'

export interface Landmark {
  x: number
  y: number
  z: number
}

/** Top-level gesture category reported by the recognizer for one hand. */
export interface GestureCategory {
  name: string
  score: number
}

const CATEGORY_TO_MOVE: Record<string, Move> = {
  Closed_Fist: 'rock',
  Open_Palm: 'paper',
  Victory: 'scissors',
}

export const DEFAULT_MIN_SCORE = 0.5

export function moveFromCategory(
  category: GestureCategory | undefined,
  minScore = DEFAULT_MIN_SCORE,
): Move | null {
  if (!category || category.score < minScore) return null
  return CATEGORY_TO_MOVE[category.name] ?? null
}

// MediaPipe Hands landmark indices.
const WRIST = 0
const TIPS = { thumb: 4, index: 8, middle: 12, ring: 16, pinky: 20 } as const
const PIPS = { thumb: 2, index: 6, middle: 10, ring: 14, pinky: 18 } as const

function sqDistFromWrist(lm: Landmark[], i: number): number {
  const w = lm[WRIST]
  const p = lm[i]
  const dx = p.x - w.x
  const dy = p.y - w.y
  return dx * dx + dy * dy
}

/**
 * A finger is "extended" when its tip is farther from the wrist than its PIP
 * joint. This is orientation-independent (works whether the hand points up,
 * down, or sideways), which matters for a mirrored webcam feed.
 */
export function fingerStates(lm: Landmark[]): Record<keyof typeof TIPS, boolean> {
  const extended = (finger: keyof typeof TIPS) =>
    sqDistFromWrist(lm, TIPS[finger]) > sqDistFromWrist(lm, PIPS[finger])
  return {
    thumb: extended('thumb'),
    index: extended('index'),
    middle: extended('middle'),
    ring: extended('ring'),
    pinky: extended('pinky'),
  }
}

export function moveFromLandmarks(lm: Landmark[] | undefined): Move | null {
  if (!lm || lm.length < 21) return null
  const f = fingerStates(lm)
  const fingers = [f.index, f.middle, f.ring, f.pinky]
  const extendedCount = fingers.filter(Boolean).length

  if (extendedCount === 0) return 'rock'
  if (f.index && f.middle && !f.ring && !f.pinky) return 'scissors'
  if (extendedCount >= 3) return 'paper'
  return null
}

/** Combined detection used by the camera loop. */
export function detectMove(
  category: GestureCategory | undefined,
  landmarks: Landmark[] | undefined,
  minScore = DEFAULT_MIN_SCORE,
): Move | null {
  return moveFromCategory(category, minScore) ?? moveFromLandmarks(landmarks)
}
