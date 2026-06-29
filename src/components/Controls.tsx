import { Camera, Hand, Pause, Play, RotateCcw, Video, VideoOff, Volume2, VolumeX } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Difficulty, GamePhase, InputMode } from '@/game/types'
import { DIFFICULTIES } from '@/game/types'
import { Button } from './Button'
import { cn } from '@/lib/cn'

interface ControlsProps {
  phase: GamePhase
  paused: boolean
  onStart: () => void
  onTogglePause: () => void
  onRestart: () => void
  difficulty: Difficulty
  setDifficulty: (d: Difficulty) => void
  totalRounds: number
  setTotalRounds: (n: number) => void
  soundEnabled: boolean
  toggleSound: () => void
  inputMode: InputMode
  setInputMode: (m: InputMode) => void
  showVideo: boolean
  toggleVideo: () => void
}

const ROUND_OPTIONS = [3, 5, 10]

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex items-center gap-2 font-pixel text-lg uppercase tracking-wider text-muted">
      {label}
      {children}
    </label>
  )
}

function Select<T extends string | number>({
  value,
  onChange,
  options,
  disabled,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
  disabled?: boolean
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) =>
        onChange((typeof value === 'number' ? Number(e.target.value) : e.target.value) as T)
      }
      className="rounded-md border-2 border-border bg-surface px-2 py-1 font-pixel text-xl text-fg disabled:opacity-40"
    >
      {options.map((o) => (
        <option key={String(o.value)} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

function IconToggle({
  on,
  onClick,
  title,
  children,
}: {
  on: boolean
  onClick: () => void
  title: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={on}
      className={cn(
        'grid h-9 w-9 place-items-center rounded-md border-2 transition',
        on ? 'border-accent text-accent' : 'border-border text-muted hover:text-fg',
      )}
    >
      {children}
    </button>
  )
}

export function Controls(props: ControlsProps) {
  const { phase, paused } = props
  const active = phase !== 'idle' && phase !== 'gameover'

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap items-center justify-center gap-3">
        {!active ? (
          <Button variant="primary" onClick={props.onStart} className="px-8">
            <Play className="mr-2 inline" size={18} />
            {phase === 'gameover' ? 'Play again' : 'Start'}
          </Button>
        ) : (
          <Button variant="primary" onClick={props.onTogglePause} className="px-6">
            {paused ? <Play className="mr-2 inline" size={18} /> : <Pause className="mr-2 inline" size={18} />}
            {paused ? 'Resume' : 'Pause'}
          </Button>
        )}
        <Button variant="danger" onClick={props.onRestart} title="Restart">
          <RotateCcw size={18} />
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
        <Field label="CPU">
          <Select
            value={props.difficulty}
            disabled={active}
            onChange={props.setDifficulty}
            options={DIFFICULTIES.map((d) => ({ value: d, label: d }))}
          />
        </Field>
        <Field label="Rounds">
          <Select
            value={props.totalRounds}
            disabled={active}
            onChange={props.setTotalRounds}
            options={ROUND_OPTIONS.map((n) => ({ value: n, label: String(n) }))}
          />
        </Field>

        <div className="flex items-center gap-2">
          <IconToggle
            on={props.inputMode === 'camera'}
            onClick={() =>
              props.setInputMode(props.inputMode === 'camera' ? 'manual' : 'camera')
            }
            title={props.inputMode === 'camera' ? 'Using camera (click for buttons)' : 'Using buttons (click for camera)'}
          >
            {props.inputMode === 'camera' ? <Camera size={18} /> : <Hand size={18} />}
          </IconToggle>
          {props.inputMode === 'camera' && (
            <IconToggle on={props.showVideo} onClick={props.toggleVideo} title="Toggle webcam view">
              {props.showVideo ? <Video size={18} /> : <VideoOff size={18} />}
            </IconToggle>
          )}
          <IconToggle on={props.soundEnabled} onClick={props.toggleSound} title="Toggle sound">
            {props.soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </IconToggle>
        </div>
      </div>
    </div>
  )
}
