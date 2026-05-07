import 'server-only'
import { randomUUID } from 'crypto'
import { mockStationSubmissions, mockStations } from '@/lib/mock-data'
import type { SessionUser } from '@/types/auth'
import type { StationSubmissionInput, StationSubmissionVoteInput } from '@/lib/utils/validators'
import type {
  StationSubmissionListItem,
  StationSubmissionStatus,
  StationSubmissionVoteType,
} from '@/types/station-submission'
import type { Station } from '@/types/station'

export const STATION_SUBMISSION_LEGIT_THRESHOLD = 46
export const STATION_SUBMISSION_REJECT_THRESHOLD = 6

export async function listStationSubmissions(
  params: { status?: StationSubmissionStatus; limit?: number } = {},
): Promise<StationSubmissionListItem[]> {
  let results = [...mockStationSubmissions]
  if (params.status) results = results.filter((s) => s.status === params.status)
  results.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return results.slice(0, Math.min(params.limit ?? 100, 200))
}

export async function createStationSubmission(
  input: StationSubmissionInput,
  session: SessionUser,
): Promise<string> {
  const id = randomUUID()
  const nowIso = new Date().toISOString()

  const submission: StationSubmissionListItem = {
    id,
    name: input.name,
    brand: input.brand ?? null,
    address: input.address ?? null,
    city: input.city,
    province: input.province,
    latitude: input.latitude,
    longitude: input.longitude,
    fuelTypes: input.fuelTypes,
    status: 'pending',
    legitCount: 0,
    notLegitCount: 0,
    legitThreshold: STATION_SUBMISSION_LEGIT_THRESHOLD,
    rejectThreshold: STATION_SUBMISSION_REJECT_THRESHOLD,
    submittedBy: session.uid,
    submittedByName: session.displayName ?? null,
    submittedByEmail: session.email ?? null,
    createdAt: nowIso,
    updatedAt: nowIso,
    approvedAt: null,
    approvedBy: null,
    rejectedAt: null,
    rejectedBy: null,
    promotedStationId: null,
  }

  mockStationSubmissions.push(submission)
  return id
}

export async function voteStationSubmission(
  input: StationSubmissionVoteInput,
  session: SessionUser,
): Promise<{ promotedStationId?: string }> {
  const idx = mockStationSubmissions.findIndex((s) => s.id === input.submissionId)
  if (idx === -1) throw new Error('Station submission not found')

  const submission = mockStationSubmissions[idx]
  if (submission.status !== 'pending') throw new Error('This station submission is already closed')
  if (submission.submittedBy === session.uid) throw new Error('Other users must validate your submitted station')

  const nowIso = new Date().toISOString()

  if (input.voteType === 'legit') {
    const newCount = submission.legitCount + 1
    mockStationSubmissions[idx] = { ...submission, legitCount: newCount, updatedAt: nowIso }

    if (newCount >= submission.legitThreshold) {
      return promoteSubmission(idx, input.submissionId, mockStationSubmissions[idx], nowIso, 'community')
    }
    return {}
  }

  const newRejectCount = submission.notLegitCount + 1
  const nowRejected = newRejectCount >= submission.rejectThreshold
  mockStationSubmissions[idx] = {
    ...submission,
    notLegitCount: newRejectCount,
    status: nowRejected ? 'rejected' : 'pending',
    rejectedAt: nowRejected ? nowIso : null,
    rejectedBy: nowRejected ? 'community' : null,
    updatedAt: nowIso,
  }

  return {}
}

export async function approveStationSubmission(
  submissionId: string,
  session: SessionUser,
): Promise<{ promotedStationId: string }> {
  const idx = mockStationSubmissions.findIndex((s) => s.id === submissionId)
  if (idx === -1) throw new Error('Station submission not found')

  const submission = mockStationSubmissions[idx]
  if (submission.status === 'approved' && submission.promotedStationId) {
    return { promotedStationId: submission.promotedStationId }
  }

  const nowIso = new Date().toISOString()
  const result = await promoteSubmission(idx, submissionId, submission, nowIso, session.uid)
  return { promotedStationId: result.promotedStationId! }
}

export async function rejectStationSubmission(submissionId: string, session: SessionUser): Promise<void> {
  const idx = mockStationSubmissions.findIndex((s) => s.id === submissionId)
  if (idx === -1) return
  const nowIso = new Date().toISOString()
  mockStationSubmissions[idx] = {
    ...mockStationSubmissions[idx],
    status: 'rejected',
    rejectedAt: nowIso,
    rejectedBy: session.uid,
    updatedAt: nowIso,
  }
}

function promoteSubmission(
  idx: number,
  submissionId: string,
  submission: StationSubmissionListItem,
  nowIso: string,
  approvedBy: string,
): { promotedStationId: string } {
  const stationId = `community-${submissionId}`

  const newStation: Station = {
    id: stationId,
    name: submission.name,
    brand: submission.brand ?? null,
    address: submission.address ?? null,
    barangay: null,
    city: submission.city,
    province: submission.province,
    latitude: submission.latitude,
    longitude: submission.longitude,
    fuelTypes: Array.from(new Set(submission.fuelTypes)),
    latestPrices: {},
    lastUpdatedAt: null,
    dataSource: 'community-submission',
    externalId: submissionId,
    createdAt: nowIso,
    updatedAt: nowIso,
  }

  const existingStationIdx = mockStations.findIndex((s) => s.id === stationId)
  if (existingStationIdx !== -1) {
    mockStations[existingStationIdx] = { ...mockStations[existingStationIdx], ...newStation }
  } else {
    mockStations.push(newStation)
  }

  mockStationSubmissions[idx] = {
    ...submission,
    status: 'approved',
    approvedAt: nowIso,
    approvedBy,
    promotedStationId: stationId,
    updatedAt: nowIso,
  }

  return { promotedStationId: stationId }
}

export function isStationSubmissionVoteType(value: string | null): value is StationSubmissionVoteType {
  return value === 'legit' || value === 'not_legit'
}

export function isStationSubmissionStatus(value: string | null): value is StationSubmissionStatus {
  return value === 'pending' || value === 'approved' || value === 'rejected'
}
