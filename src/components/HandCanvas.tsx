import { Loader2 } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import type { RefObject } from 'react'
import type { Move, Outcome } from '@/game/types'
import type { DetectionStatus } from '@/hooks/useHandDetection'
import { MOVE_COLOR, MOVE_EMOJI, MOVE_LABEL } from '@/lib/moveVisuals'
import { cn } from '@/lib/cn'
import { CameraHelp } from './CameraHelp'

interface HandCanvasProps {
  videoRef: RefObject<HTMLVideoElement | null>
  canvasRef: RefObject<HTMLCanvasElement | null>
  status: DetectionStatus
  showVideo: boolean
  detectedMove: Move | null
  holdProgress: number
  holdMove: Move | null
  /** True during the holding phase — shows the hold ring + live readout. */
  active: boolean
  /** Committed move to reveal over the camera (kept mounted so the stream lives). */
  revealMove: Move | null
  outcome: Outcome | null
  onPlayManual: () => void
}

const RING_R = 46
const RING_C = 2 * Math.PI * RING_R
const RING_COLOR: Record<Move, string> = { rock: '#f59e0b', paper: '#38bdf8', scissors: '#f472b6' }
const OUTCOME_BORDER: Record<Outcome, string> = {
  win: 'border-win',
  lose: 'border-lose',
  draw: 'border-draw',
}

export function HandCanvas({
  videoRef,
  canvasRef,
  status,
  showVideo,
  detectedMove,
  holdProgress,
  holdMove,
  active,
  revealMove,
  outcome,
  onPlayManual,
}: HandCanvasProps) {
  return (
    <div
      className={cn(
        'relative aspect-[4/3] w-full overflow-hidden rounded-xl border-2 bg-black transition-colors',
        revealMove && outcome ? OUTCOME_BORDER[outcome] : 'border-border',
      )}
    >
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className={cn(
          'mirror absolute inset-0 h-full w-full object-cover transition-opacity',
          showVideo ? 'opacity-100' : 'opacity-0',
        )}
      />
      <canvas ref={canvasRef} className="mirror absolute inset-0 h-full w-full object-cover" />

      <span className="absolute left-1/2 top-2 z-10 -translate-x-1/2 font-pixel text-2xl uppercase tracking-[0.3em] text-muted">
        You
      </span>

      {/* Live detected-move readout (bottom, so it never collides with the title) */}
      {status === 'ready' && !revealMove && (
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-bg/70 px-3 py-1 backdrop-blur-sm">
          <span className="text-xl">{detectedMove ? MOVE_EMOJI[detectedMove] : '🖐️'}</span>
          <span
            className={cn('font-pixel text-xl', detectedMove ? MOVE_COLOR[detectedMove] : 'text-muted')}
          >
            {detectedMove ? MOVE_LABEL[detectedMove] : 'show a move'}
          </span>
        </div>
      )}

      {/* Hold-to-confirm progress ring */}
      {active && status === 'ready' && holdMove && (
        <div className="absolute inset-0 z-10 grid place-items-center">
          <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
            <circle cx="50" cy="50" r={RING_R} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="6" />
            <circle
              cx="50"
              cy="50"
              r={RING_R}
              fill="none"
              stroke={RING_COLOR[holdMove]}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={RING_C}
              strokeDashoffset={RING_C * (1 - holdProgress)}
              style={{ transition: 'stroke-dashoffset 60ms linear' }}
            />
          </svg>
        </div>
      )}

      {/* Reveal overlay — shows the move you committed */}
      <AnimatePresence>
        {revealMove && (
          <motion.div
            key={revealMove}
            className="absolute inset-0 z-10 grid place-items-center bg-bg/75"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.span
              initial={{ scale: 0.3, rotate: -25 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 18 }}
              className="text-[clamp(3.5rem,12vw,7.5rem)] leading-none"
            >
              {MOVE_EMOJI[revealMove]}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {status === 'loading' && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-bg/80">
          <div className="flex items-center gap-2 text-muted">
            <Loader2 className="animate-spin" size={20} />
            <span className="font-pixel text-lg">starting camera…</span>
          </div>
        </div>
      )}

      {(status === 'denied' || status === 'error') && (
        <CameraHelp status={status} onPlayManual={onPlayManual} />
      )}
    </div>
  )
}
