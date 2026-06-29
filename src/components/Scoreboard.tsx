import { cn } from '@/lib/cn'

interface ScoreboardProps {
  playerScore: number
  cpuScore: number
  round: number
  totalRounds: number
  active: boolean
}

function Score({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex min-w-16 flex-col items-center">
      <span className="font-pixel text-base uppercase tracking-[0.25em] text-muted">{label}</span>
      <span className={cn('font-pixel text-7xl leading-none', color)}>{value}</span>
    </div>
  )
}

export function Scoreboard({ playerScore, cpuScore, round, totalRounds, active }: ScoreboardProps) {
  return (
    <div className="flex items-center justify-center gap-8">
      <Score label="You" value={playerScore} color="text-win" />
      <div className="flex flex-col items-center gap-1 rounded-lg border border-border bg-surface/60 px-4 py-2">
        <span className="font-pixel text-sm uppercase tracking-widest text-muted">Round</span>
        <span className="font-pixel text-3xl leading-none text-accent">
          {active ? `${round}/${totalRounds}` : `–/${totalRounds}`}
        </span>
      </div>
      <Score label="CPU" value={cpuScore} color="text-lose" />
    </div>
  )
}
