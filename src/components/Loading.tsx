import { motion } from 'framer-motion'

export function Loading({ label = 'Loading model…' }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-bg">
      <div className="flex flex-col items-center gap-6">
        <div className="relative h-20 w-20">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="absolute inset-0 rounded-full border-2 border-accent/70"
              style={{ borderTopColor: 'transparent', borderRightColor: 'transparent' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1.4 - i * 0.3, repeat: Infinity, ease: 'linear' }}
            />
          ))}
        </div>
        <p className="font-pixel text-2xl tracking-widest text-muted">{label}</p>
      </div>
    </div>
  )
}
