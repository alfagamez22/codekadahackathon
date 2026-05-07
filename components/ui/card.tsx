import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg' | 'none'
}

const paddings = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-6' }

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  return (
    <div className={cn('rounded-lg border border-border bg-card shadow-sm', paddings[padding], className)}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-4 border-b border-border pb-3', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-sm font-semibold tracking-[-0.01em] text-foreground', className)}>
      {children}
    </h3>
  )
}

export function CardDescription({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('text-sm text-muted-foreground', className)}>
      {children}
    </p>
  )
}
