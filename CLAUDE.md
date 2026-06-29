# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A browser-based Rock Paper Scissors game (v2). The player makes their move with a
hand gesture captured via webcam; hand landmarks + a gesture label are produced by
MediaPipe's `GestureRecognizer`, the move is locked with a **hold-to-confirm**
interaction, and a difficulty-based CPU bot picks its move. Fully playable without a
camera via on-screen buttons / `R`,`P`,`S` keys. Built with Vite + React 19 +
TypeScript; entirely client-side, no backend.

> v2 replaced the original Create React App / `@tensorflow-models/handpose` /
> `fingerpose` / MUI Joy stack. If you find references to those, they're stale.

## Commands

- `npm run dev` — Vite dev server (http://localhost:5173)
- `npm run build` — `tsc -b` (type-check) + `vite build` → `dist/`
- `npm run preview` — serve the production build
- `npm test` — Vitest once (CI); `npm run test:watch` for watch mode
- `npm run lint` — ESLint (flat config, `typescript-eslint`)
- `npm run format` — Prettier

The `@` alias maps to `src/` (configured in `vite.config.ts` and `tsconfig.app.json`).

## MediaPipe model assets

`@mediapipe/tasks-vision` needs a WASM fileset + a `.task` model. These are
**self-hosted** under `public/models/` (no CDN) but are large (~20 MB) and **git-
ignored**. `scripts/setup-models.mjs` provisions them on `postinstall` and via the
`prebuild` script — it copies the wasm out of `node_modules` and downloads the model
once. If `public/models/` is missing, run `node scripts/setup-models.mjs`.

## Architecture

The codebase separates **pure game logic** (no React, unit-tested) from **hooks**
(stateful behaviour) from **components** (presentation).

**Pure game logic (`src/game/`)** — no React imports, covered by Vitest:
- `types.ts` — `Move`, `Outcome`, `Difficulty`, `GamePhase`, `RoundRecord`, plus the
  `MOVES` / `DIFFICULTIES` const tuples.
- `rules.ts` — `resolve(player, cpu) → Outcome`, `beats()`, `counter()`. Keyed on the
  `Move` union (v1 compared image references — do **not** reintroduce that).
- `bot.ts` — `createBot(difficulty, rng?)`. Easy = random, Medium = counter the
  player's most-frequent move, Hard = order-2 Markov prediction. RNG is injectable so
  tests are deterministic.
- `gestures.ts` — maps MediaPipe output to a `Move`: first the built-in category
  (`Closed_Fist→rock`, `Open_Palm→paper`, `Victory→scissors`), then a finger-extension
  heuristic over the 21 landmarks as fallback. No MediaPipe imports → easily testable.

**Hooks (`src/hooks/`):**
- `useHandDetection.ts` — owns the camera (`getUserMedia`) + `GestureRecognizer`,
  runs a `requestAnimationFrame` loop (not `setInterval`), de-jitters the detected
  move over a few frames, and draws the skeleton. Exposes `{ videoRef, canvasRef,
  status, move, moveRef, confidence, handPresent }`. GPU delegate with CPU fallback.
- `useGameMachine.ts` — the round flow as a `useReducer` state machine:
  `idle → countdown → holding → revealing → result → (countdown | gameover)`. A hold
  accumulator commits a gesture held steady (reading `currentMoveRef` each tick);
  `commitMove()` is shared by the hold timer **and** manual buttons/keys. Emits
  `GameEvent`s (`start`/`commit`/`resolved`/`gameover`) for the UI to wire sound + stats.
  Latest values are mirrored into refs **inside an effect** (not during render — the
  `react-hooks` lint rule forbids writing refs in render).

**State (`src/store/useGameStore.ts`)** — a Zustand store (settings + stats) persisted
to `localStorage` via `persist`. Settings: `difficulty`, `totalRounds`, `soundEnabled`,
`inputMode` (`'camera' | 'manual'`), `showVideo`. Stats: rounds/games W-L-D, streaks,
per-move counts. The high-frequency detection loop deliberately does **not** write to
this store (it uses local refs) to avoid re-render thrash.

**Lib (`src/lib/`):** `draw.ts` (typed landmark skeleton renderer), `sound.ts`
(synthesized Web Audio SFX, lazily-created `AudioContext`), `moveVisuals.ts`
(emoji/label/colour maps), `cn.ts` (clsx wrapper).

**Components (`src/components/`):** `App.tsx` wires detection + machine + store + sound.
`HandCanvas` (camera + skeleton + hold ring + detected readout + reveal overlay — kept
mounted in camera mode so the video stream survives across rounds), `MovePanel`
(animated emoji reveal, used for CPU and for the manual-mode player), `ManualControls`
(R/P/S buttons + keyboard), `Controls` (game + settings), `Scoreboard`, `StatsPanel`,
`ResultModal`, `CameraHelp`, `Loading`, `SocialLinks` (inline brand SVGs — lucide 1.x
dropped brand icons), plus `Button`/`Card` primitives.

## Styling

Tailwind CSS v4, configured CSS-first via `@theme` in `src/index.css` (design tokens
like `--color-accent`, `--font-pixel`). Dark retro-arcade theme; VT323 pixel font is
self-hosted via `@fontsource/vt323` (imported in `main.tsx`). Responsiveness uses
Tailwind breakpoints — there are **no** `window.innerWidth` checks (v1 had them).

## Testing

Vitest + Testing Library (jsdom). High-value coverage on the pure logic
(`rules`/`bot`/`gestures`) and a fake-timer integration test for `useGameMachine`
(full manual game, camera auto-commit, hold-reset). The camera/MediaPipe path itself
is not unit-tested — it needs a real browser + webcam.

## PWA / deploy

`vite-plugin-pwa` precaches the app shell and runtime-caches `/models/*` (CacheFirst)
so installs stay small but repeat/offline loads work. `netlify.toml` configures the
build, SPA redirect, and model caching headers.
