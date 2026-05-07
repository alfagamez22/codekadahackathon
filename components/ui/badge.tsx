import type { PriceBadge } from '@/types/station'
import { cn } from '@/lib/utils'

const badgeConfig: Record<
  PriceBadge | 'superadmin' | 'moderator' | 'admin' | 'user' | 'pending' | 'confirmed' | 'rejected' | 'flagged' | 'expired',
  { label: string; className: string }
> = {
  'admin-verified': {
    label: 'Admin Verified',
    className: 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]',
  },
  'community-verified': {
    label: 'Community Verified',
    className: 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]',
  },
  'pending-update': {
    label: 'Pending Update',
    className: 'bg-[#fffbeb] text-[#d97706] border-[#fde68a]',
  },
  baseline: {
    label: 'Baseline Price',
    className: 'bg-[#f3f4f6] text-[#6b7280] border-[#e5e7eb]',
  },
  stale: {
    label: 'Stale Price',
    className: 'bg-[#fef2f2] text-[#dc2626] border-[#fecaca]',
  },
  moderator: {
    label: 'Moderator',
    className: 'bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe]',
  },
  superadmin: {
    label: 'Superadmin',
    className: 'bg-[#0a0a0a] text-white border-[#0a0a0a]',
  },
  admin: {
    label: 'Admin',
    className: 'bg-[#f3f4f6] text-[#0a0a0a] border-[#e5e7eb]',
  },
  user: {
    label: 'User',
    className: 'bg-[#f3f4f6] text-[#6b7280] border-[#e5e7eb]',
  },
  pending: {
    label: 'Pending',
    className: 'bg-[#fffbeb] text-[#d97706] border-[#fde68a]',
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-[#fef2f2] text-[#dc2626] border-[#fecaca]',
  },
  flagged: {
    label: 'Flagged',
    className: 'bg-[#fef2f2] text-[#dc2626] border-[#fecaca]',
  },
  expired: {
    label: 'Expired',
    className: 'bg-[#f3f4f6] text-[#9ca3af] border-[#e5e7eb]',
  },
}

type BadgeVariant = keyof typeof badgeConfig

interface BadgeProps {
  variant: BadgeVariant
  label?: string
  className?: string
}

export function Badge({ variant, label, className = '' }: BadgeProps) {
  const config = badgeConfig[variant] ?? badgeConfig.baseline
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        config.className,
        className,
      )}
    >
      {label ?? config.label}
    </span>
  )
}
