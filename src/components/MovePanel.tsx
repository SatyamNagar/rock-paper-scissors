import { AnimatePresence, motion } from 'framer-motion'
import type { Move, Outcome } from '@/game/types'
import { MOVE_EMOJI, MOVE_LABEL } from '@/lib/moveVisuals'
import { cn } from '@/lib/cn'

interface MovePanelProps {
  title: string
  move: Move | null
  /** Emoji shown when no move is set (e.g. CPU thinking). */
  placeholder?: string
  /** Tints the border once a move is revealed. */
  outcome?: Outcome | null
  /** Subtle pulse to signal "thinking". */
  thinking?: boolean
}

const OUTCOME_BORDER: Record<Outcome, string> = {
  win: 'border-win shadow-[0_0_24px_-6px_var(--color-win)]',
  lose: 'border-lose shadow-[0_0_24px_-6px_var(--color-lose)]',
  draw: 'border-draw',
}

export function MovePanel({ title, move, placeholder = '🤖', outcome, thinking }: MovePanelProps) {
  return (
    <div
      className={cn(
        'flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 bg-surface/70 transition-colors',
        move && outcome ? OUTCOME_BORDER[outcome] : 'border-border',
      )}
    >
      <span className="font-pixel text-2xl uppercase tracking-[0.3em] text-muted">{title}</span>
      <div className="grid flex-1 place-items-center">
        <AnimatePresence mode="wait">
          <motion.span
            key={move ?? 'placeholder'}
            initial={{ scale: 0.3, opacity: 0, rotate: -25 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.3, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 18 }}
            className={cn('text-[clamp(3.5rem,12vw,7.5rem)] leading-none', thinking && 'animate-pulse')}
          >
            {move ? MOVE_EMOJI[move] : placeholder}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="h-7 font-pixel text-2xl text-fg">{move ? MOVE_LABEL[move] : ' '}</span>
    </div>
  )
}
