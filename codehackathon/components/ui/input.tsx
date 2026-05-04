import type { InputHTMLAttributes, ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: ReactNode
}

export function Input({ label, error, hint, leftIcon, className = '', id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          {...props}
          className={`
            w-full rounded-lg border border-border bg-background px-3 py-2 text-sm
            placeholder:text-muted transition-colors
            focus:outline-none focus:ring-2 focus:ring-fuel-green focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            ${leftIcon ? 'pl-10' : ''}
            ${error ? 'border-fuel-red focus:ring-fuel-red' : ''}
            ${className}
          `}
        />
      </div>
      {error && <p className="text-xs text-fuel-red">{error}</p>}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
    </div>
  )
}
