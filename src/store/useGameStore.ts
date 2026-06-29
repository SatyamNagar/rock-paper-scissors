import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Difficulty, InputMode, Move, Outcome } from '@/game/types'

export interface Stats {
  gamesPlayed: number
  gameWins: number
  gameLosses: number
  gameDraws: number
  roundsWon: number
  roundsLost: number
  roundsDrawn: number
  currentStreak: number // consecutive round wins
  bestStreak: number
  moveCounts: Record<Move, number>
}

const EMPTY_STATS: Stats = {
  gamesPlayed: 0,
  gameWins: 0,
  gameLosses: 0,
  gameDraws: 0,
  roundsWon: 0,
  roundsLost: 0,
  roundsDrawn: 0,
  currentStreak: 0,
  bestStreak: 0,
  moveCounts: { rock: 0, paper: 0, scissors: 0 },
}

interface Settings {
  difficulty: Difficulty
  totalRounds: number
  soundEnabled: boolean
  inputMode: InputMode
  showVideo: boolean
}

interface GameStore extends Settings {
  stats: Stats
  setDifficulty: (d: Difficulty) => void
  setTotalRounds: (n: number) => void
  toggleSound: () => void
  setInputMode: (m: InputMode) => void
  toggleVideo: () => void
  recordRound: (outcome: Outcome, playerMove: Move) => void
  recordGame: (result: Outcome) => void
  resetStats: () => void
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      difficulty: 'medium',
      totalRounds: 3,
      soundEnabled: true,
      inputMode: 'camera',
      showVideo: true,
      stats: EMPTY_STATS,

      setDifficulty: (difficulty) => set({ difficulty }),
      setTotalRounds: (totalRounds) => set({ totalRounds }),
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
      setInputMode: (inputMode) => set({ inputMode }),
      toggleVideo: () => set((s) => ({ showVideo: !s.showVideo })),

      recordRound: (outcome, playerMove) =>
        set((s) => {
          const stats = { ...s.stats, moveCounts: { ...s.stats.moveCounts } }
          stats.moveCounts[playerMove] += 1
          if (outcome === 'win') {
            stats.roundsWon += 1
            stats.currentStreak += 1
            stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak)
          } else if (outcome === 'lose') {
            stats.roundsLost += 1
            stats.currentStreak = 0
          } else {
            stats.roundsDrawn += 1
          }
          return { stats }
        }),

      recordGame: (result) =>
        set((s) => {
          const stats = { ...s.stats }
          stats.gamesPlayed += 1
          if (result === 'win') stats.gameWins += 1
          else if (result === 'lose') stats.gameLosses += 1
          else stats.gameDraws += 1
          return { stats }
        }),

      resetStats: () => set({ stats: EMPTY_STATS }),
    }),
    {
      name: 'rps-v2',
      partialize: (s) => ({
        difficulty: s.difficulty,
        totalRounds: s.totalRounds,
        soundEnabled: s.soundEnabled,
        inputMode: s.inputMode,
        showVideo: s.showVideo,
        stats: s.stats,
      }),
    },
  ),
)
