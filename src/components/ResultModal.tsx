import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Outcome } from '@/game/types'
import { OUTCOME_COLOR } from '@/lib/moveVisuals'
import { Button } from './Button'

interface ResultModalProps {
  open: boolean
  playerScore: number
  cpuScore: number
  result: Outcome
  onClose: () => void
  onPlayAgain: () => void
}

const TITLE: Record<Outcome, string> = {
  win: 'Victory!',
  lose: 'Defeat',
  draw: 'Dead Heat',
}

const EMOJI: Record<Outcome, string> = { win: '🏆', lose: '💀', draw: '🤝' }

export function ResultModal({
  open,
  playerScore,
  cpuScore,
  result,
  onClose,
  onPlayAgain,
}: ResultModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 grid place-items-center bg-black/70 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            className="w-full max-w-sm rounded-2xl border-2 border-border bg-surface p-8 text-center"
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-6xl">{EMOJI[result]}</div>
            <h2 className={`mt-2 font-pixel text-5xl ${OUTCOME_COLOR[result]}`}>{TITLE[result]}</h2>
            <p className="mt-3 font-pixel text-2xl text-fg">
              You <span className="text-win">{playerScore}</span> · {' '}
              <span className="text-lose">{cpuScore}</span> CPU
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button variant="primary" onClick={onPlayAgain}>
                Play again
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
