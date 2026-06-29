// The CPU opponent. Three difficulties, all pure functions of the player's
// move history (most recent move last), so they're fully unit-testable with an
// injected RNG.
//
//   easy   — uniform random; provably fair.
//   medium — counters the player's most-frequent move.
//   hard   — order-2 Markov: predicts the player's next move from the moves
//            that historically followed their last two, then counters it.
//
// Every difficulty mixes in an ε chance of a random throw so the bot is never
// fully deterministic (and thus not trivially exploitable).
import type { Difficulty, Move } from './types'
import { MOVES } from './types'
import { counter } from './rules'

export type Rng = () => number

/** Chance of ignoring the model and throwing at random. */
export const EPSILON = 0.15

export interface Bot {
  next(history: Move[]): Move
}

function randomMove(rng: Rng): Move {
  return MOVES[Math.min(MOVES.length - 1, Math.floor(rng() * MOVES.length))]
}

function emptyCounts(): Record<Move, number> {
  return { rock: 0, paper: 0, scissors: 0 }
}

function argMax(counts: Record<Move, number>): Move | null {
  let best: Move | null = null
  let bestN = 0
  for (const m of MOVES) {
    if (counts[m] > bestN) {
      bestN = counts[m]
      best = m
    }
  }
  return best
}

export function mostFrequent(history: Move[]): Move | null {
  if (history.length === 0) return null
  const counts = emptyCounts()
  for (const m of history) counts[m] += 1
  return argMax(counts)
}

/** Predicts the next move given the two preceding moves as context. */
export function markovPredict(history: Move[]): Move | null {
  if (history.length < 3) return null
  const context = `${history[history.length - 2]}>${history[history.length - 1]}`
  const counts = emptyCounts()
  let seen = 0
  for (let i = 2; i < history.length; i++) {
    if (`${history[i - 2]}>${history[i - 1]}` === context) {
      counts[history[i]] += 1
      seen += 1
    }
  }
  return seen > 0 ? argMax(counts) : null
}

export function createBot(difficulty: Difficulty, rng: Rng = Math.random): Bot {
  return {
    next(history) {
      if (difficulty === 'easy') return randomMove(rng)

      if (difficulty === 'medium') {
        const fav = mostFrequent(history)
        if (!fav || rng() < EPSILON) return randomMove(rng)
        return counter(fav)
      }

      // hard
      const predicted = markovPredict(history) ?? mostFrequent(history)
      if (!predicted || rng() < EPSILON) return randomMove(rng)
      return counter(predicted)
    },
  }
}
