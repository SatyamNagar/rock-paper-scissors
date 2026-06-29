import { useEffect, useRef, useState } from 'react'
import {
  FilesetResolver,
  GestureRecognizer,
  type GestureRecognizerResult,
} from '@mediapipe/tasks-vision'
import { detectMove, type Landmark } from '@/game/gestures'
import { drawLandmarks } from '@/lib/draw'
import type { Move } from '@/game/types'

export type DetectionStatus = 'loading' | 'ready' | 'denied' | 'error'

const WASM_PATH = '/models/wasm'
const MODEL_PATH = '/models/gesture_recognizer.task'

// A move must persist this many consecutive frames before it's reported, which
// debounces classifier flicker so the hold-to-confirm timer doesn't reset.
const STABILITY_FRAMES = 3

export interface HandDetection {
  videoRef: React.RefObject<HTMLVideoElement | null>
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  status: DetectionStatus
  /** Current de-jittered move, or null when no clear gesture is detected. */
  move: Move | null
  /** Synchronous read of the latest stable move (no re-render). */
  moveRef: React.RefObject<Move | null>
  confidence: number
  handPresent: boolean
}

async function createRecognizer(): Promise<GestureRecognizer> {
  const vision = await FilesetResolver.forVisionTasks(WASM_PATH)
  const options = (delegate: 'GPU' | 'CPU') =>
    GestureRecognizer.createFromOptions(vision, {
      baseOptions: { modelAssetPath: MODEL_PATH, delegate },
      runningMode: 'VIDEO' as const,
      numHands: 1,
    })
  try {
    return await options('GPU')
  } catch {
    // Some browsers / headless contexts have no WebGL delegate.
    return await options('CPU')
  }
}

export function useHandDetection(enabled = true): HandDetection {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const moveRef = useRef<Move | null>(null)

  const [status, setStatus] = useState<DetectionStatus>('loading')
  const [move, setMove] = useState<Move | null>(null)
  const [confidence, setConfidence] = useState(0)
  const [handPresent, setHandPresent] = useState(false)

  useEffect(() => {
    if (!enabled) return

    let cancelled = false
    let raf = 0
    let recognizer: GestureRecognizer | null = null
    let stream: MediaStream | null = null
    let lastVideoTime = -1
    const candidate = { move: null as Move | null, count: 0 }

    const processResult = (result: GestureRecognizerResult) => {
      const landmarks = result.landmarks?.[0] as Landmark[] | undefined
      const top = result.gestures?.[0]?.[0]
      const category = top ? { name: top.categoryName, score: top.score } : undefined
      const detected = detectMove(category, landmarks)

      const canvas = canvasRef.current
      const video = videoRef.current
      if (canvas && video) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
        }
        const ctx = canvas.getContext('2d')
        if (ctx) drawLandmarks(ctx, landmarks)
      }

      setHandPresent(Boolean(landmarks))

      // Debounce: only surface a move once it's been stable for a few frames.
      if (detected === candidate.move) {
        candidate.count += 1
      } else {
        candidate.move = detected
        candidate.count = 1
      }
      if (candidate.count >= STABILITY_FRAMES && moveRef.current !== detected) {
        moveRef.current = detected
        setMove(detected)
        setConfidence(category?.score ?? 0)
      }
    }

    const loop = () => {
      const video = videoRef.current
      if (video && recognizer && video.readyState >= 2 && video.videoWidth > 0) {
        if (video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime
          try {
            processResult(recognizer.recognizeForVideo(video, performance.now()))
          } catch {
            // transient frame errors are non-fatal; keep looping
          }
        }
      }
      raf = requestAnimationFrame(loop)
    }

    const init = async () => {
      try {
        recognizer = await createRecognizer()
      } catch {
        if (!cancelled) setStatus('error')
        return
      }
      if (cancelled) {
        recognizer.close()
        return
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        })
      } catch {
        if (!cancelled) setStatus('denied')
        return
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }
      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        try {
          await video.play()
        } catch {
          /* autoplay can reject silently; the loop tolerates it */
        }
      }
      setStatus('ready')
      raf = requestAnimationFrame(loop)
    }

    void init()

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      stream?.getTracks().forEach((t) => t.stop())
      recognizer?.close()
      moveRef.current = null
    }
  }, [enabled])

  return { videoRef, canvasRef, status, move, moveRef, confidence, handPresent }
}
