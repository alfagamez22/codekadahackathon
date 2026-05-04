import type { PriceBadge } from '@/types/station'

const badgeConfig: Record<
  PriceBadge | 'moderator' | 'admin' | 'user' | 'pending' | 'confirmed' | 'rejected' | 'flagged' | 'expired',
  { label: string; className: string }
> = {
  'admin-verified': {
    label: 'Admin Verified',
    className: 'bg-amber-100 text-amber-800 border border-amber-200',
  },
  'community-verified': {
    label: 'Community Verified',
    className: 'bg-fuel-green-light text-fuel-green-dark border border-green-200',
  },
  'pending-update': {
    label: 'Pending Update',
    className: 'bg-fuel-yellow-light text-amber-800 border border-yellow-200',
  },
  baseline: {
    label: 'Baseline Price',
    className: 'bg-fuel-gray-light text-fuel-gray border border-gray-200',
  },
  stale: {
    label: 'Stale Price',
    className: 'bg-fuel-red-light text-fuel-red border border-red-200',
  },
  moderator: {
    label: 'Moderator',
    className: 'bg-purple-100 text-purple-800 border border-purple-200',
  },
  admin: {
    label: 'Admin',
    className: 'bg-amber-100 text-amber-800 border border-amber-200',
  },
  user: {
    label: 'User',
    className: 'bg-blue-100 text-blue-800 border border-blue-200',
  },
  pending: {
    label: 'Pending',
    className: 'bg-fuel-yellow-light text-amber-800 border border-yellow-200',
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-fuel-green-light text-fuel-green-dark border border-green-200',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-fuel-red-light text-fuel-red border border-red-200',
  },
  flagged: {
    label: 'Flagged',
    className: 'bg-orange-100 text-orange-800 border border-orange-200',
  },
  expired: {
    label: 'Expired',
    className: 'bg-gray-100 text-gray-500 border border-gray-200',
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
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className} ${className}`}
    >
      {label ?? config.label}
    </span>
  )
}
