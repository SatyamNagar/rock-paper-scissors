import { describe, it, expect } from 'vitest'
import { beats, counter, resolve } from './rules'
import { MOVES } from './types'

describe('rules', () => {
  it('resolves draws', () => {
    for (const m of MOVES) expect(resolve(m, m)).toBe('draw')
  })

  it('resolves player wins', () => {
    expect(resolve('rock', 'scissors')).toBe('win')
    expect(resolve('paper', 'rock')).toBe('win')
    expect(resolve('scissors', 'paper')).toBe('win')
  })

  it('resolves player losses', () => {
    expect(resolve('scissors', 'rock')).toBe('lose')
    expect(resolve('rock', 'paper')).toBe('lose')
    expect(resolve('paper', 'scissors')).toBe('lose')
  })

  it('beats is the win relation', () => {
    expect(beats('rock', 'scissors')).toBe(true)
    expect(beats('scissors', 'rock')).toBe(false)
    expect(beats('rock', 'rock')).toBe(false)
  })

  it('counter returns the move that beats the input', () => {
    for (const m of MOVES) expect(beats(counter(m), m)).toBe(true)
  })
})
