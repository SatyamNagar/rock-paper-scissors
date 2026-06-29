import { useCallback, useEffect, useReducer, useRef } from 'react'
import type { Difficulty, GamePhase, Move, Outcome, RoundRecord } from '@/game/types'
import { resolve } from '@/game/rules'
import { createBot } from '@/game/bot'

// Timings (ms)
export const HOLD_DURATION_MS = 800 // hold a gesture this long to commit it
const COUNTDOWN_MS = 1000 // brief "get ready" prime before each round
const REVEAL_MS = 900 // reveal animation
const RESULT_MS = 1600 // how long the round result stays up
const HOLD_TICK_MS = 1000 / 30

export interface GameState {
  phase: GamePhase
  round: number // 1-based; 0 while idle
  totalRounds: number
  playerScore: number
  cpuScore: number
  playerMove: Move | null
  cpuMove: Move | null
  outcome: Outcome | null
  holdProgress: number // 0..1 while holding
  holdMove: Move | null // gesture currently being held (preview)
  paused: boolean
  history: Move[] // player's committed moves this game (feeds the bot)
}

const initialState: GameState = {
  phase: 'idle',
  round: 0,
  totalRounds: 3,
  playerScore: 0,
  cpuScore: 0,
  playerMove: null,
  cpuMove: null,
  outcome: null,
  holdProgress: 0,
  holdMove: null,
  paused: false,
  history: [],
}

type Action =
  | { type: 'START'; totalRounds: number }
  | { type: 'BEGIN_HOLD' }
  | { type: 'SET_HOLD'; progress: number; move: Move | null }
  | { type: 'COMMIT'; player: Move; cpu: Move; outcome: Outcome }
  | { type: 'SHOW_RESULT' }
  | { type: 'ADVANCE' }
  | { type: 'SET_PAUSED'; paused: boolean }
  | { type: 'RESET' }

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START':
      return {
        ...initialState,
        phase: 'countdown',
        round: 1,
        totalRounds: action.totalRounds,
      }
    case 'BEGIN_HOLD':
      return { ...state, phase: 'holding', holdProgress: 0, holdMove: null }
    case 'SET_HOLD':
      return { ...state, holdProgress: action.progress, holdMove: action.move }
    case 'COMMIT':
      return {
        ...state,
        phase: 'revealing',
        playerMove: action.player,
        cpuMove: action.cpu,
        outcome: action.outcome,
        playerScore: state.playerScore + (action.outcome === 'win' ? 1 : 0),
        cpuScore: state.cpuScore + (action.outcome === 'lose' ? 1 : 0),
        holdProgress: 1,
        history: [...state.history, action.player],
      }
    case 'SHOW_RESULT':
      return { ...state, phase: 'result' }
    case 'ADVANCE':
      if (state.round >= state.totalRounds) return { ...state, phase: 'gameover' }
      return {
        ...state,
        phase: 'countdown',
        round: state.round + 1,
        playerMove: null,
        cpuMove: null,
        outcome: null,
        holdProgress: 0,
        holdMove: null,
      }
    case 'SET_PAUSED':
      return { ...state, paused: action.paused }
    case 'RESET':
      return initialState
  }
}

export type GameEvent =
  | { type: 'start' }
  | { type: 'commit'; move: Move }
  | { type: 'resolved'; record: RoundRecord }
  | { type: 'gameover'; playerScore: number; cpuScore: number; result: Outcome }

export interface UseGameMachineArgs {
  /** Live de-jittered move from the camera; null in manual mode / no hand. */
  currentMoveRef: React.RefObject<Move | null>
  difficulty: Difficulty
  onEvent?: (event: GameEvent) => void
}

export interface GameMachine {
  state: GameState
  start: (totalRounds: number) => void
  /** Lock in a move now (manual buttons/keys, or the hold timer completing). */
  commitMove: (move: Move) => void
  togglePause: () => void
  reset: () => void
}

function finalResult(playerScore: number, cpuScore: number): Outcome {
  if (playerScore > cpuScore) return 'win'
  if (playerScore < cpuScore) return 'lose'
  return 'draw'
}

export function useGameMachine({
  currentMoveRef,
  difficulty,
  onEvent,
}: UseGameMachineArgs): GameMachine {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Refs mirror the latest values so stable callbacks/timers never go stale.
  // (Synced in an effect rather than during render, per react-hooks rules.)
  const stateRef = useRef(state)
  const difficultyRef = useRef(difficulty)
  const onEventRef = useRef(onEvent)
  useEffect(() => {
    stateRef.current = state
    difficultyRef.current = difficulty
    onEventRef.current = onEvent
  })

  const commitMove = useCallback((move: Move) => {
    const s = stateRef.current
    if (s.phase !== 'holding') return
    const cpu = createBot(difficultyRef.current).next(s.history)
    const outcome = resolve(move, cpu)
    onEventRef.current?.({ type: 'commit', move })
    dispatch({ type: 'COMMIT', player: move, cpu, outcome })
  }, [])

  const start = useCallback((totalRounds: number) => {
    onEventRef.current?.({ type: 'start' })
    dispatch({ type: 'START', totalRounds })
  }, [])

  const togglePause = useCallback(() => {
    dispatch({ type: 'SET_PAUSED', paused: !stateRef.current.paused })
  }, [])

  const reset = useCallback(() => dispatch({ type: 'RESET' }), [])

  // Hold accumulator: only runs during the interactive holding phase.
  useEffect(() => {
    if (state.phase !== 'holding' || state.paused) return
    let heldMove: Move | null = null
    let progress = 0
    let last = performance.now()
    const id = window.setInterval(() => {
      const now = performance.now()
      const dt = now - last
      last = now
      const m = currentMoveRef.current
      if (!m) {
        heldMove = null
        progress = 0
      } else if (m !== heldMove) {
        heldMove = m
        progress = 0
      } else {
        progress = Math.min(1, progress + dt / HOLD_DURATION_MS)
      }
      dispatch({ type: 'SET_HOLD', progress, move: heldMove })
      if (progress >= 1 && heldMove) commitMove(heldMove)
    }, HOLD_TICK_MS)
    return () => window.clearInterval(id)
  }, [state.phase, state.paused, currentMoveRef, commitMove])

  // Timed phase transitions (countdown -> hold, reveal -> result -> advance).
  useEffect(() => {
    if (state.paused) return
    if (state.phase === 'countdown') {
      const t = window.setTimeout(() => dispatch({ type: 'BEGIN_HOLD' }), COUNTDOWN_MS)
      return () => window.clearTimeout(t)
    }
    if (state.phase === 'revealing') {
      const t = window.setTimeout(() => {
        const s = stateRef.current
        if (s.playerMove && s.cpuMove && s.outcome) {
          onEventRef.current?.({
            type: 'resolved',
            record: { player: s.playerMove, cpu: s.cpuMove, outcome: s.outcome },
          })
        }
        dispatch({ type: 'SHOW_RESULT' })
      }, REVEAL_MS)
      return () => window.clearTimeout(t)
    }
    if (state.phase === 'result') {
      const t = window.setTimeout(() => {
        const s = stateRef.current
        if (s.round >= s.totalRounds) {
          onEventRef.current?.({
            type: 'gameover',
            playerScore: s.playerScore,
            cpuScore: s.cpuScore,
            result: finalResult(s.playerScore, s.cpuScore),
          })
        }
        dispatch({ type: 'ADVANCE' })
      }, RESULT_MS)
      return () => window.clearTimeout(t)
    }
  }, [state.phase, state.paused])

  return { state, start, commitMove, togglePause, reset }
}
