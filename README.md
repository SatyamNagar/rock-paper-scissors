# Rock · Paper · Scissors — v2 (Gesture Edition)

Play Rock Paper Scissors against a smart CPU using **hand gestures via your webcam**.
Hold a gesture steady to lock it in, and the CPU reveals its move. No camera? Play
with on-screen buttons or the **R / P / S** keys.

> v2 is a ground-up rewrite of a 4-year-old Create React App project — now on
> **Vite + React 19 + TypeScript**, with modern hand detection, a real game state
> machine, persisted stats, sound, animations, and offline PWA support.

## Features

- 🖐️ **Gesture input** via MediaPipe `GestureRecognizer` (21-point hand landmarks
  drawn live as a skeleton overlay).
- ⏱️ **Hold-to-confirm** — hold a gesture for ~0.8s to commit it; a ring shows progress.
- 🤖 **Difficulty levels** — Easy (random), Medium (counters your favourite move),
  Hard (order-2 Markov prediction of your next move).
- ⌨️ **Full keyboard / button fallback** — playable without a camera.
- 📊 **Persisted stats** — win rate, streaks, per-move usage (localStorage).
- 🔊 **Synthesized sound** (Web Audio — no audio files) and animated reveals.
- 📱 **Installable PWA**, responsive, works offline after first load.

## Getting started

```bash
npm install      # also fetches the MediaPipe model + wasm (see below)
npm run dev      # http://localhost:5173
```

| Command | Description |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check + production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the Vitest unit/integration suite |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

> **Camera note:** `getUserMedia` requires a secure context — `localhost` and HTTPS
> work; plain-HTTP LAN IPs do not.

## How detection works

The app uses MediaPipe's `GestureRecognizer` (`@mediapipe/tasks-vision`), whose
built-in categories map directly to moves — `Closed_Fist → rock`,
`Open_Palm → paper`, `Victory → scissors`. When the built-in label is weak, a small
finger-extension heuristic over the raw landmarks (`src/game/gestures.ts`) takes over.

The model and WASM runtime are **self-hosted** under `public/models/` rather than
loaded from a CDN. They're large (~20 MB total), so they are **not committed** —
`scripts/setup-models.mjs` provisions them on `postinstall` and before `build`
(copying the wasm from `node_modules`, downloading the `.task` model once).

## Deploy (Netlify)

`netlify.toml` is preconfigured: build `npm run build`, publish `dist`, SPA
redirect, and an immutable cache header for `/models/*`. `npm install` runs the
model setup automatically, so a connected repo deploys as-is.

## Tech stack

Vite 8 · React 19 · TypeScript · Tailwind CSS v4 · Zustand · Framer Motion ·
`@mediapipe/tasks-vision` · `vite-plugin-pwa` · Vitest.
