import { describe, it, expect } from 'vitest'
import { createBot, markovPredict, mostFrequent } from './bot'
import { MOVES, type Move } from './types'

// rng that never triggers the epsilon (random) branch, so the "smart" path runs.
const noEpsilon = () => 0.99

describe('mostFrequent', () => {
  it('returns null for empty history', () => {
    expect(mostFrequent([])).toBeNull()
  })
  it('finds the most common move', () => {
    expect(mostFrequent(['rock', 'rock', 'paper'])).toBe('rock')
  })
})

describe('markovPredict', () => {
  it('returns null without enough history', () => {
    expect(markovPredict(['rock', 'paper'])).toBeNull()
  })
  it('predicts the move that follows the last-two-move context', () => {
    // After "rock>paper", the player always threw scissors.
    const history: Move[] = ['rock', 'paper', 'scissors', 'rock', 'paper', 'scissors', 'rock', 'paper']
    expect(markovPredict(history)).toBe('scissors')
  })
})

describe('createBot', () => {
  it('easy always returns a valid move', () => {
    const bot = createBot('easy', () => 0)
    for (let i = 0; i < 10; i++) expect(MOVES).toContain(bot.next([]))
  })

  it('medium counters the player favourite move', () => {
    const bot = createBot('medium', noEpsilon)
    // Player loves rock -> bot should play paper.
    expect(bot.next(['rock', 'rock', 'rock'])).toBe('paper')
  })

  it('hard counters the predicted next move', () => {
    const bot = createBot('hard', noEpsilon)
    const history: Move[] = ['rock', 'paper', 'scissors', 'rock', 'paper', 'scissors', 'rock', 'paper']
    // predicts scissors -> counters with rock
    expect(bot.next(history)).toBe('rock')
  })

  it('falls back to a random move on an empty history', () => {
    const bot = createBot('hard', noEpsilon)
    expect(MOVES).toContain(bot.next([]))
  })
})
