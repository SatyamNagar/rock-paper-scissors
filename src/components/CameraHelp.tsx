import { CameraOff } from 'lucide-react'
import { Button } from './Button'
import type { DetectionStatus } from '@/hooks/useHandDetection'

interface CameraHelpProps {
  status: DetectionStatus
  onPlayManual: () => void
}

export function CameraHelp({ status, onPlayManual }: CameraHelpProps) {
  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-bg/90 p-6 text-center">
      <div className="flex max-w-xs flex-col items-center gap-3">
        <CameraOff className="text-lose" size={40} />
        <h3 className="font-pixel text-2xl text-fg">Camera unavailable</h3>
        <p className="text-sm text-muted">
          {status === 'denied'
            ? 'Camera access was blocked. Allow it in your browser, or play with buttons and keys instead.'
            : 'Could not start the camera on this device. You can still play with buttons and keys.'}
        </p>
        <Button variant="primary" onClick={onPlayManual} className="mt-1">
          Play without camera
        </Button>
      </div>
    </div>
  )
}
