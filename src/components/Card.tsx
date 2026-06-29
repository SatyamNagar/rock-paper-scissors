import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-surface/80 shadow-lg shadow-black/40 backdrop-blur-sm',
        className,
      )}
      {...props}
    />
  )
}
