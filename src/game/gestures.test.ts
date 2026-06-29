import { describe, it, expect } from 'vitest'
import { detectMove, moveFromCategory, moveFromLandmarks, type Landmark } from './gestures'

type Fingers = 'thumb' | 'index' | 'middle' | 'ring' | 'pinky'
const PIP: Record<Fingers, number> = { thumb: 2, index: 6, middle: 10, ring: 14, pinky: 18 }
const TIP: Record<Fingers, number> = { thumb: 4, index: 8, middle: 12, ring: 16, pinky: 20 }
const COL: Record<Fingers, number> = { thumb: 0.3, index: 0.42, middle: 0.5, ring: 0.58, pinky: 0.7 }

const at = (x: number, y: number): Landmark => ({ x, y, z: 0 })

/**
 * Builds a 21-point hand. Wrist sits low; an "extended" finger places its tip
 * farther from the wrist than its PIP, a curled finger places it closer.
 */
function makeHand(extended: Record<Fingers, boolean>): Landmark[] {
  const lm = Array.from({ length: 21 }, () => at(0.5, 0.8))
  lm[0] = at(0.5, 0.9) // wrist
  for (const f of Object.keys(PIP) as Fingers[]) {
    lm[PIP[f]] = at(COL[f], 0.6) // pip distance^2 from wrist ~ 0.09 + dx^2
    lm[TIP[f]] = at(COL[f], extended[f] ? 0.3 : 0.75)
  }
  return lm
}

const ALL_CURLED = { thumb: false, index: false, middle: false, ring: false, pinky: false }

describe('moveFromCategory', () => {
  it('maps recognizer categories to moves', () => {
    expect(moveFromCategory({ name: 'Closed_Fist', score: 0.9 })).toBe('rock')
    expect(moveFromCategory({ name: 'Open_Palm', score: 0.9 })).toBe('paper')
    expect(moveFromCategory({ name: 'Victory', score: 0.9 })).toBe('scissors')
  })
  it('rejects low-confidence and unknown categories', () => {
    expect(moveFromCategory({ name: 'Closed_Fist', score: 0.2 })).toBeNull()
    expect(moveFromCategory({ name: 'ILoveYou', score: 0.9 })).toBeNull()
    expect(moveFromCategory(undefined)).toBeNull()
  })
})

describe('moveFromLandmarks', () => {
  it('detects rock (all fingers curled)', () => {
    expect(moveFromLandmarks(makeHand(ALL_CURLED))).toBe('rock')
  })
  it('detects paper (all fingers extended)', () => {
    expect(
      moveFromLandmarks(makeHand({ thumb: true, index: true, middle: true, ring: true, pinky: true })),
    ).toBe('paper')
  })
  it('detects scissors (index + middle extended)', () => {
    expect(
      moveFromLandmarks(makeHand({ ...ALL_CURLED, index: true, middle: true })),
    ).toBe('scissors')
  })
  it('returns null for an ambiguous shape (pointing)', () => {
    expect(moveFromLandmarks(makeHand({ ...ALL_CURLED, index: true }))).toBeNull()
  })
  it('returns null for too few landmarks', () => {
    expect(moveFromLandmarks([at(0, 0)])).toBeNull()
  })
})

describe('detectMove', () => {
  it('prefers a confident recognizer category over geometry', () => {
    // Category says rock; landmarks say paper. Category wins.
    const paperHand = makeHand({ thumb: true, index: true, middle: true, ring: true, pinky: true })
    expect(detectMove({ name: 'Closed_Fist', score: 0.95 }, paperHand)).toBe('rock')
  })
  it('falls back to geometry when the category is weak', () => {
    const scissorsHand = makeHand({ ...ALL_CURLED, index: true, middle: true })
    expect(detectMove({ name: 'ILoveYou', score: 0.9 }, scissorsHand)).toBe('scissors')
  })
})
