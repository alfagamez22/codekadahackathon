import type { FuelType } from './station'

export type StationSubmissionStatus = 'pending' | 'approved' | 'rejected'

export type StationSubmissionVoteType = 'legit' | 'not_legit'

export interface StationSubmissionListItem {
  id: string
  name: string
  brand: string | null
  address: string | null
  city: string
  province: string
  latitude: number
  longitude: number
  fuelTypes: FuelType[]
  status: StationSubmissionStatus
  legitCount: number
  notLegitCount: number
  legitThreshold: number
  rejectThreshold: number
  submittedBy: string
  submittedByName: string | null
  submittedByEmail: string | null
  createdAt: string
  updatedAt: string
  approvedAt?: string | null
  approvedBy?: string | null
  rejectedAt?: string | null
  rejectedBy?: string | null
  promotedStationId?: string | null
}
