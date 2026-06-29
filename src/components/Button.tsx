import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'ghost' | 'danger'

const VARIANTS: Record<Variant, string> = {
  primary:
    'border-accent text-accent hover:bg-accent hover:text-bg hover:shadow-[var(--shadow-glow)]',
  ghost: 'border-border text-fg hover:border-accent-2 hover:text-accent-2',
  danger: 'border-lose/60 text-lose hover:bg-lose hover:text-bg',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

export function Button({ variant = 'ghost', className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'cursor-pointer rounded-md border-2 bg-surface px-4 py-2 font-pixel text-xl uppercase tracking-widest transition',
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-surface disabled:hover:text-fg',
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  )
}
