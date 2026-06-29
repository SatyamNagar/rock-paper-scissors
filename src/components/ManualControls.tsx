import { useEffect } from 'react'
import type { Move } from '@/game/types'
import { MOVES } from '@/game/types'
import { MOVE_EMOJI, MOVE_LABEL } from '@/lib/moveVisuals'
import { cn } from '@/lib/cn'

interface ManualControlsProps {
  onPick: (move: Move) => void
  enabled: boolean
}

const KEY: Record<Move, string> = { rock: 'R', paper: 'P', scissors: 'S' }
const KEY_TO_MOVE: Record<string, Move> = { r: 'rock', p: 'paper', s: 'scissors' }

export function ManualControls({ onPick, enabled }: ManualControlsProps) {
  useEffect(() => {
    if (!enabled) return
    const handler = (e: KeyboardEvent) => {
      const move = KEY_TO_MOVE[e.key.toLowerCase()]
      if (move) {
        e.preventDefault()
        onPick(move)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [enabled, onPick])

  return (
    <div className="flex justify-center gap-3">
      {MOVES.map((move) => (
        <button
          key={move}
          type="button"
          disabled={!enabled}
          onClick={() => onPick(move)}
          aria-label={`${MOVE_LABEL[move]} (key ${KEY[move]})`}
          className={cn(
            'flex flex-col items-center gap-1 rounded-lg border-2 border-border bg-surface px-4 py-2 transition',
            'hover:border-accent hover:shadow-[var(--shadow-glow)]',
            'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:shadow-none',
          )}
        >
          <span className="text-4xl">{MOVE_EMOJI[move]}</span>
          <span className="font-pixel text-base text-muted">
            {MOVE_LABEL[move]} · {KEY[move]}
          </span>
        </button>
      ))}
    </div>
  )
}
