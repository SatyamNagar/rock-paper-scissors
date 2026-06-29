// Tiny synthesized SFX — no audio files, no licensing. Each effect is a short
// scheduled oscillator with a gentle attack/decay envelope (avoids clicks).
// The AudioContext is created lazily on first play so it's unlocked by a user
// gesture (start button), satisfying browser autoplay policies.

export type Sfx = 'click' | 'countdown' | 'commit' | 'win' | 'lose' | 'draw' | 'gameover'

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  return ctx
}

interface Note {
  freq: number
  start: number // seconds, relative to now
  dur: number
  type?: OscillatorType
  gain?: number
}

const PATTERNS: Record<Sfx, Note[]> = {
  click: [{ freq: 520, start: 0, dur: 0.05, type: 'square', gain: 0.18 }],
  countdown: [{ freq: 440, start: 0, dur: 0.09, type: 'sine', gain: 0.22 }],
  commit: [
    { freq: 330, start: 0, dur: 0.07, type: 'square', gain: 0.22 },
    { freq: 660, start: 0.06, dur: 0.1, type: 'square', gain: 0.22 },
  ],
  win: [
    { freq: 523, start: 0, dur: 0.1, type: 'triangle', gain: 0.25 },
    { freq: 659, start: 0.1, dur: 0.1, type: 'triangle', gain: 0.25 },
    { freq: 784, start: 0.2, dur: 0.16, type: 'triangle', gain: 0.25 },
  ],
  lose: [
    { freq: 392, start: 0, dur: 0.12, type: 'sawtooth', gain: 0.2 },
    { freq: 262, start: 0.12, dur: 0.2, type: 'sawtooth', gain: 0.2 },
  ],
  draw: [
    { freq: 349, start: 0, dur: 0.09, type: 'sine', gain: 0.2 },
    { freq: 349, start: 0.12, dur: 0.12, type: 'sine', gain: 0.2 },
  ],
  gameover: [
    { freq: 523, start: 0, dur: 0.12, type: 'triangle', gain: 0.26 },
    { freq: 659, start: 0.12, dur: 0.12, type: 'triangle', gain: 0.26 },
    { freq: 784, start: 0.24, dur: 0.12, type: 'triangle', gain: 0.26 },
    { freq: 1047, start: 0.36, dur: 0.24, type: 'triangle', gain: 0.26 },
  ],
}

export function playSfx(name: Sfx, enabled = true): void {
  if (!enabled) return
  const ac = getCtx()
  if (!ac) return
  if (ac.state === 'suspended') void ac.resume()

  const now = ac.currentTime
  for (const note of PATTERNS[name]) {
    const osc = ac.createOscillator()
    const env = ac.createGain()
    const peak = note.gain ?? 0.2
    const t0 = now + note.start
    const t1 = t0 + note.dur
    osc.type = note.type ?? 'sine'
    osc.frequency.value = note.freq
    env.gain.setValueAtTime(0.0001, t0)
    env.gain.exponentialRampToValueAtTime(peak, t0 + 0.01)
    env.gain.exponentialRampToValueAtTime(0.0001, t1)
    osc.connect(env).connect(ac.destination)
    osc.start(t0)
    osc.stop(t1 + 0.02)
  }
}
