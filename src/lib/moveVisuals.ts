import type { Move, Outcome } from '@/game/types'

export const MOVE_EMOJI: Record<Move, string> = {
  rock: '✊',
  paper: '✋',
  scissors: '✌️',
}

export const MOVE_LABEL: Record<Move, string> = {
  rock: 'Rock',
  paper: 'Paper',
  scissors: 'Scissors',
}

/** Tailwind text-color token per move (see @theme in index.css). */
export const MOVE_COLOR: Record<Move, string> = {
  rock: 'text-rock',
  paper: 'text-paper',
  scissors: 'text-scissors',
}

export const OUTCOME_LABEL: Record<Outcome, string> = {
  win: 'You win!',
  lose: 'CPU wins!',
  draw: 'Draw!',
}

export const OUTCOME_COLOR: Record<Outcome, string> = {
  win: 'text-win',
  lose: 'text-lose',
  draw: 'text-draw',
}
