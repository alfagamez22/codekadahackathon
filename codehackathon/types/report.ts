import type { FuelType } from './station'

export type ReportStatus = 'pending' | 'confirmed' | 'rejected' | 'expired' | 'flagged'

export type VoteType = 'confirm' | 'reject' | 'flag'

export interface PriceReport {
  id: string
  stationId: string
  fuelType: FuelType
  reportedPrice: number
  normalizedPrice: number
  reporterId: string
  evidenceUrl: string | null
  status: ReportStatus
  confirmCount: number
  rejectCount: number
  flagCount: number
  expiresAt: string
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
