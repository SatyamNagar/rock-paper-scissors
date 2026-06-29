import { useCallback, useState } from 'react'
import { useGameStore } from '@/store/useGameStore'
import { useHandDetection } from '@/hooks/useHandDetection'
import { useGameMachine, type GameEvent } from '@/hooks/useGameMachine'
import { playSfx } from '@/lib/sound'
import type { Outcome } from '@/game/types'
import { OUTCOME_LABEL } from '@/lib/moveVisuals'
import { Loading } from '@/components/Loading'
import { HandCanvas } from '@/components/HandCanvas'
import { MovePanel } from '@/components/MovePanel'
import { Scoreboard } from '@/components/Scoreboard'
import { ManualControls } from '@/components/ManualControls'
import { Controls } from '@/components/Controls'
import { StatsPanel } from '@/components/StatsPanel'
import { ResultModal } from '@/components/ResultModal'
import { SocialLinks } from '@/components/SocialLinks'

const invertOutcome = (o: Outcome | null): Outcome | null =>
  o === 'win' ? 'lose' : o === 'lose' ? 'win' : o

function phaseMessage(phase: string, outcome: Outcome | null, manual: boolean): string {
  switch (phase) {
    case 'idle':
      return 'Press Start to play'
    case 'countdown':
      return 'Get ready…'
    case 'holding':
      return manual ? 'Make your move!' : 'Hold your move!'
    case 'revealing':
      return 'Reveal!'
    case 'result':
      return outcome ? OUTCOME_LABEL[outcome] : ''
    case 'gameover':
      return 'Game over'
    default:
      return ''
  }
}

export default function App() {
  const store = useGameStore()
  const { difficulty, totalRounds, soundEnabled, inputMode, showVideo, stats } = store

  const cameraEnabled = inputMode === 'camera'
  const detection = useHandDetection(cameraEnabled)

  const [showResult, setShowResult] = useState(false)

  const handleEvent = useCallback(
    (e: GameEvent) => {
      switch (e.type) {
        case 'start':
          playSfx('click', soundEnabled)
          break
        case 'commit':
          playSfx('commit', soundEnabled)
          break
        case 'resolved':
          store.recordRound(e.record.outcome, e.record.player)
          playSfx(e.record.outcome, soundEnabled)
          break
        case 'gameover':
          store.recordGame(e.result)
          playSfx('gameover', soundEnabled)
          setShowResult(true)
          break
      }
    },
    // store methods are stable; soundEnabled must stay fresh
    [soundEnabled, store],
  )

  const machine = useGameMachine({
    currentMoveRef: detection.moveRef,
    difficulty,
    onEvent: handleEvent,
  })
  const { state } = machine

  const handleStart = () => machine.start(totalRounds)
  const handleRestart = () => {
    machine.reset()
    setShowResult(false)
  }
  const handlePlayAgain = () => {
    setShowResult(false)
    machine.start(totalRounds)
  }

  const isHolding = state.phase === 'holding'
  const isReveal = state.phase === 'revealing' || state.phase === 'result'
  const overallResult: Outcome =
    state.playerScore > state.cpuScore ? 'win' : state.playerScore < state.cpuScore ? 'lose' : 'draw'

  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 p-4 sm:p-6">
      {cameraEnabled && detection.status === 'loading' && <Loading />}

      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-pixel text-5xl text-accent sm:text-6xl">Rock · Paper · Scissors</h1>
          <p className="font-pixel text-lg text-muted">v2 · gesture edition</p>
        </div>
        <SocialLinks />
      </header>

      <main className="grid flex-1 gap-6 lg:grid-cols-[1fr_340px] lg:content-center lg:items-start">
        <section className="flex flex-col gap-6">
          <Scoreboard
            playerScore={state.playerScore}
            cpuScore={state.cpuScore}
            round={state.round}
            totalRounds={state.totalRounds}
            active={state.phase !== 'idle' && state.phase !== 'gameover'}
          />

          <p className="text-center font-pixel text-3xl text-fg">
            {state.paused ? 'Paused' : phaseMessage(state.phase, state.outcome, !cameraEnabled)}
          </p>

          <div className="relative grid grid-cols-2 gap-3 sm:gap-5">
            <MovePanel
              title="CPU"
              move={isReveal ? state.cpuMove : null}
              placeholder="🤖"
              thinking={isHolding || state.phase === 'countdown'}
              outcome={invertOutcome(state.outcome)}
            />

            {/* Center VS chip */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
              <span className="grid h-12 w-12 place-items-center rounded-full border-2 border-accent bg-bg font-pixel text-2xl text-accent shadow-[var(--shadow-glow)] sm:h-14 sm:w-14">
                VS
              </span>
            </div>

            {cameraEnabled ? (
              <HandCanvas
                videoRef={detection.videoRef}
                canvasRef={detection.canvasRef}
                status={detection.status}
                showVideo={showVideo}
                detectedMove={detection.move}
                holdProgress={state.holdProgress}
                holdMove={state.holdMove}
                active={isHolding}
                revealMove={isReveal ? state.playerMove : null}
                outcome={state.outcome}
                onPlayManual={() => store.setInputMode('manual')}
              />
            ) : (
              <MovePanel
                title="You"
                move={isReveal ? state.playerMove : null}
                placeholder="🤚"
                outcome={state.outcome}
              />
            )}
          </div>

          {isHolding && <ManualControls onPick={machine.commitMove} enabled={isHolding} />}

          <Controls
            phase={state.phase}
            paused={state.paused}
            onStart={handleStart}
            onTogglePause={machine.togglePause}
            onRestart={handleRestart}
            difficulty={difficulty}
            setDifficulty={store.setDifficulty}
            totalRounds={totalRounds}
            setTotalRounds={store.setTotalRounds}
            soundEnabled={soundEnabled}
            toggleSound={store.toggleSound}
            inputMode={inputMode}
            setInputMode={store.setInputMode}
            showVideo={showVideo}
            toggleVideo={store.toggleVideo}
          />
        </section>

        <aside className="flex flex-col gap-4">
          <StatsPanel stats={stats} onReset={store.resetStats} />
        </aside>
      </main>

      <ResultModal
        open={showResult}
        playerScore={state.playerScore}
        cpuScore={state.cpuScore}
        result={overallResult}
        onClose={() => setShowResult(false)}
        onPlayAgain={handlePlayAgain}
      />
    </div>
  )
}
