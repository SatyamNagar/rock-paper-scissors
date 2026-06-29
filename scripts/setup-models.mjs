// Provisions the MediaPipe assets the app loads at runtime, without committing
// large binaries to the repo. Runs on `postinstall` and before `build`:
//   1. copies the tasks-vision WASM fileset from node_modules into public/models/wasm
//   2. downloads the gesture_recognizer .task model if it isn't already present
import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const wasmSrc = join(root, 'node_modules/@mediapipe/tasks-vision/wasm')
const wasmDest = join(root, 'public/models/wasm')
const modelPath = join(root, 'public/models/gesture_recognizer.task')
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task'

mkdirSync(wasmDest, { recursive: true })

if (existsSync(wasmSrc)) {
  for (const file of readdirSync(wasmSrc)) {
    copyFileSync(join(wasmSrc, file), join(wasmDest, file))
  }
  console.log('[setup-models] copied WASM fileset -> public/models/wasm')
} else {
  console.warn('[setup-models] @mediapipe/tasks-vision/wasm not found; skipping WASM copy')
}

if (existsSync(modelPath) && statSync(modelPath).size > 0) {
  console.log('[setup-models] gesture_recognizer.task already present; skipping download')
} else {
  console.log('[setup-models] downloading gesture_recognizer.task ...')
  const res = await fetch(MODEL_URL)
  if (!res.ok) throw new Error(`Failed to download model: ${res.status} ${res.statusText}`)
  const buf = Buffer.from(await res.arrayBuffer())
  const { writeFileSync } = await import('node:fs')
  writeFileSync(modelPath, buf)
  console.log(`[setup-models] saved model (${(buf.length / 1e6).toFixed(1)} MB)`)
}
