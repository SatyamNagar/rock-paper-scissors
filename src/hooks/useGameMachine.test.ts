import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGameMachine, type GameEvent, HOLD_DURATION_MS } from './useGameMachine'
import type { Move } from '@/game/types'

// Drives the machine deterministically: Math.random -> 0 makes every bot
// difficulty throw 'rock'. performance.now() is mocked so the hold accumulator
// sees controllable elapsed time under fake timers.
let nowMs = 0

function advance(ms: number) {
  const step = 1000 / 30
  for (let elapsed = 0; elapsed < ms; elapsed += step) {
    nowMs += step
    act(() => {
      vi.advanceTimersByTime(step)
    })
  }
}

function setup(difficulty: 'easy' | 'medium' | 'hard' = 'easy') {
  const moveRef = { current: null as Move | null }
  const events: GameEvent[] = []
  const hook = renderHook(() =>
    useGameMachine({
      currentMoveRef: moveRef,
      difficulty,
      onEvent: (e) => events.push(e),
    }),
  )
  return { hook, moveRef, events }
}

describe('useGameMachine', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    nowMs = 0
    vi.spyOn(performance, 'now').mockImplementation(() => nowMs)
    vi.spyOn(Math, 'random').mockReturnValue(0) // bot always throws rock
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('plays a full manual round to game over', () => {
    const { hook, events } = setup('easy')

    act(() => hook.result.current.start(1))
    expect(hook.result.current.state.phase).toBe('countdown')

    advance(1100) // countdown -> holding
    expect(hook.result.current.state.phase).toBe('holding')

    // Player throws paper; bot throws rock -> player wins.
    act(() => hook.result.current.commitMove('paper'))
    expect(hook.result.current.state.phase).toBe('revealing')
    expect(hook.result.current.state.playerMove).toBe('paper')
    expect(hook.result.current.state.cpuMove).toBe('rock')
    expect(hook.result.current.state.playerScore).toBe(1)

    advance(1000) // revealing -> result
    expect(hook.result.current.state.phase).toBe('result')

    advance(2000) // result -> gameover (only 1 round)
    expect(hook.result.current.state.phase).toBe('gameover')

    const types = events.map((e) => e.type)
    expect(types).toEqual(['start', 'commit', 'resolved', 'gameover'])
    const over = events.find((e) => e.type === 'gameover')
    expect(over).toMatchObject({ playerScore: 1, cpuScore: 0, result: 'win' })
  })

  it('auto-commits a gesture held steady (camera mode)', () => {
    const { hook, moveRef } = setup('easy')

    act(() => hook.result.current.start(1))
    advance(1100) // -> holding
    expect(hook.result.current.state.phase).toBe('holding')

    // Hold scissors steady well past the hold threshold.
    moveRef.current = 'scissors'
    advance(HOLD_DURATION_MS + 300)

    // scissors vs rock -> player loses, but the move committed automatically.
    expect(hook.result.current.state.phase).not.toBe('holding')
    expect(hook.result.current.state.playerMove).toBe('scissors')
    expect(hook.result.current.state.cpuMove).toBe('rock')
    expect(hook.result.current.state.cpuScore).toBe(1)
  })

  it('resets hold progress when the gesture changes', () => {
    const { hook, moveRef } = setup('easy')
    act(() => hook.result.current.start(1))
    advance(1100)

    moveRef.current = 'rock'
    advance(HOLD_DURATION_MS / 2)
    expect(hook.result.current.state.phase).toBe('holding')
    expect(hook.result.current.state.holdProgress).toBeGreaterThan(0)

    // Switching the gesture restarts the timer.
    moveRef.current = 'paper'
    advance(100)
    expect(hook.result.current.state.holdProgress).toBeLessThan(0.5)
    expect(hook.result.current.state.phase).toBe('holding')
  })
})
