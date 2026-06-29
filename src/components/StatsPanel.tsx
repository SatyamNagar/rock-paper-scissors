import { Trophy } from 'lucide-react'
import type { Stats } from '@/store/useGameStore'
import { MOVE_EMOJI } from '@/lib/moveVisuals'
import { MOVES } from '@/game/types'
import { Card } from './Card'

interface StatsPanelProps {
  stats: Stats
  onReset: () => void
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-base uppercase tracking-wider text-muted">{label}</span>
      <span className="font-pixel text-2xl text-fg">{value}</span>
    </div>
  )
}

export function StatsPanel({ stats, onReset }: StatsPanelProps) {
  const totalRounds = stats.roundsWon + stats.roundsLost + stats.roundsDrawn
  const winRate = totalRounds ? Math.round((stats.roundsWon / totalRounds) * 100) : 0

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-pixel text-3xl text-accent">
          <Trophy size={20} /> Stats
        </h2>
        <button
          type="button"
          onClick={onReset}
          className="text-xs uppercase tracking-wider text-muted hover:text-lose"
        >
          reset
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <Stat label="Round win rate" value={`${winRate}%`} />
        <Stat label="Rounds W / L / D" value={`${stats.roundsWon} / ${stats.roundsLost} / ${stats.roundsDrawn}`} />
        <Stat label="Games played" value={stats.gamesPlayed} />
        <Stat label="Game wins" value={stats.gameWins} />
        <Stat label="Current streak" value={stats.currentStreak} />
        <Stat label="Best streak" value={stats.bestStreak} />
      </div>

      <div className="mt-3 border-t border-border pt-3">
        <span className="text-sm uppercase tracking-wider text-muted">Your moves</span>
        <div className="mt-1 flex justify-between font-pixel text-xl">
          {MOVES.map((m) => (
            <span key={m} className="flex items-center gap-1">
              {MOVE_EMOJI[m]} {stats.moveCounts[m]}
            </span>
          ))}
        </div>
      </div>
    </Card>
  )
}
