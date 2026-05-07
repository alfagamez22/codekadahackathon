import type { ReactNode, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary:
    'bg-[#0a0a0a] text-white hover:bg-[#1a1a1a] dark:bg-[#f9fafb] dark:text-[#0a0a0a] dark:hover:bg-white',
  secondary:
    'bg-white text-[#0a0a0a] border border-[#e5e7eb] hover:bg-[#f9fafb] dark:bg-[#111111] dark:text-[#f9fafb] dark:border-[#1f2937] dark:hover:bg-[#1f2937]',
  ghost:
    'bg-transparent text-[#6b7280] hover:text-[#0a0a0a] hover:bg-[#f3f4f6] dark:text-[#9ca3af] dark:hover:text-[#f9fafb] dark:hover:bg-[#1f2937]',
  danger:
    'bg-[#dc2626] text-white hover:bg-[#b91c1c]',
}

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs h-7',
  md: 'px-3.5 py-2 text-sm h-9',
  lg: 'px-5 py-2.5 text-sm h-10',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium tracking-[-0.01em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {loading && (
        <svg className="animate-spin h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
