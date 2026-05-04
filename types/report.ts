import type { FuelType } from './station'

export type ReportStatus = 'pending' | 'confirmed' | 'rejected' | 'expired' | 'flagged'

export type VoteType = 'confirm' | 'reject' | 'flag'

export interface PriceReport {
  id: string
  stationId: string
  fuelType: FuelType
  reportedPrice: number
  normalizedPrice: number
  baselinePrice?: number | null
  priceDeltaPercent?: number | null
  reporterId: string
  evidenceUrl: string | null
  status: ReportStatus
  confirmCount: number
  rejectCount: number
  flagCount: number
  validatorThreshold?: number
  confirmationCount?: number
  expiresAt: string
  confirmedAt?: string
  createdAt: string
  updatedAt: string
}

export interface ValidationVote {
  id: string
  reportId: string
  userId: string
  voteType: VoteType
  votedAt: string
}
