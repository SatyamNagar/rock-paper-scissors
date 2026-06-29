// Core game domain types — shared across detection, rules, bot, store and UI.

export type Move = 'rock' | 'paper' | 'scissors'

export const MOVES = ['rock', 'paper', 'scissors'] as const

/** Outcome of a round, always from the player's perspective. */
export type Outcome = 'win' | 'lose' | 'draw'

export type Difficulty = 'easy' | 'medium' | 'hard'

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const

/** How the player commits a move. */
export type InputMode = 'camera' | 'manual'

/** Phases of the per-round hold-to-confirm flow. */
export type GamePhase =
  | 'idle' // not started / between games
  | 'countdown' // brief "get ready" before a round accepts input
  | 'holding' // waiting for the player to hold a gesture steady
  | 'revealing' // both hands locked, reveal animation playing
  | 'result' // round resolved, score shown
  | 'gameover' // all rounds played

export interface RoundRecord {
  player: Move
  cpu: Move
  outcome: Outcome
}
