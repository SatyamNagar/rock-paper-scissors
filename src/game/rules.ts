// Pure Rock/Paper/Scissors rules. No image-reference comparisons (the v1 bug) —
// everything is keyed on the Move union.
import type { Move, Outcome } from './types'

/** What each move defeats. */
const BEATS: Record<Move, Move> = {
  rock: 'scissors',
  paper: 'rock',
  scissors: 'paper',
}

/** The move that defeats `move`. */
const COUNTERS: Record<Move, Move> = {
  rock: 'paper',
  paper: 'scissors',
  scissors: 'rock',
}

export function beats(a: Move, b: Move): boolean {
  return BEATS[a] === b
}

/** Returns the move that beats the given move. */
export function counter(move: Move): Move {
  return COUNTERS[move]
}

/** Outcome from the player's perspective. */
export function resolve(player: Move, cpu: Move): Outcome {
  if (player === cpu) return 'draw'
  return beats(player, cpu) ? 'win' : 'lose'
}
