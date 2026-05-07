import 'server-only'
import { getAdminDb } from '../firestore'
import {
  FieldValue,
  type DocumentReference,
  type DocumentSnapshot,
  type Query,
  type Transaction,
} from 'firebase-admin/firestore'
import type { SessionUser } from '@/types/auth'
import type { StationSubmissionInput, StationSubmissionVoteInput } from '@/lib/utils/validators'
import type {
  StationSubmissionListItem,
  StationSubmissionStatus,
  StationSubmissionVoteType,
} from '@/types/station-submission'

export const STATION_SUBMISSION_LEGIT_THRESHOLD = 46
export const STATION_SUBMISSION_REJECT_THRESHOLD = 6

function asStationSubmission(doc: DocumentSnapshot): StationSubmissionListItem {
  const data = doc.data() as Partial<StationSubmissionListItem> | undefined

  return {
    id: doc.id,
    name: String(data?.name ?? 'Unnamed station'),
    brand: typeof data?.brand === 'string' ? data.brand : null,
    address: typeof data?.address === 'string' ? data.address : null,
    city: String(data?.city ?? 'Metro Manila'),
    province: String(data?.province ?? 'NCR'),
    latitude: Number(data?.latitude ?? 0),
    longitude: Number(data?.longitude ?? 0),
    fuelTypes: Array.isArray(data?.fuelTypes) ? data.fuelTypes : [],
    status: (data?.status ?? 'pending') as StationSubmissionStatus,
    legitCount: Number(data?.legitCount ?? 0),
    notLegitCount: Number(data?.notLegitCount ?? 0),
    legitThreshold: Number(data?.legitThreshold ?? STATION_SUBMISSION_LEGIT_THRESHOLD),
    rejectThreshold: Number(data?.rejectThreshold ?? STATION_SUBMISSION_REJECT_THRESHOLD),
    submittedBy: String(data?.submittedBy ?? ''),
    submittedByName: typeof data?.submittedByName === 'string' ? data.submittedByName : null,
    submittedByEmail: typeof data?.submittedByEmail === 'string' ? data.submittedByEmail : null,
    createdAt: String(data?.createdAt ?? ''),
    updatedAt: String(data?.updatedAt ?? ''),
    approvedAt: data?.approvedAt ?? null,
    approvedBy: data?.approvedBy ?? null,
    rejectedAt: data?.rejectedAt ?? null,
    rejectedBy: data?.rejectedBy ?? null,
    promotedStationId: data?.promotedStationId ?? null,
  }
}

function buildPromotedStation(
  submissionId: string,
  submission: StationSubmissionListItem,
  nowIso: string,
  approvedBy: string,
) {
  const stationId = `community-${submissionId}`
  return {
    stationId,
    stationData: {
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
      submittedBy: submission.submittedBy,
      approvedBy,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  }
}

function promoteSubmissionInTransaction(
  tx: Transaction,
  submissionRef: DocumentReference,
  stationRef: DocumentReference,
  submissionId: string,
  submission: StationSubmissionListItem,
  nowIso: string,
  approvedBy: string,
) {
  const { stationId, stationData } = buildPromotedStation(submissionId, submission, nowIso, approvedBy)
  tx.set(stationRef, stationData, { merge: true })
  tx.update(submissionRef, {
    status: 'approved',
    approvedAt: nowIso,
    approvedBy,
    promotedStationId: stationId,
    updatedAt: nowIso,
  })
  return stationId
}

export async function listStationSubmissions(params: {
  status?: StationSubmissionStatus
  limit?: number
} = {}): Promise<StationSubmissionListItem[]> {
  const db = await getAdminDb()
  let query: Query = db.collection('stationSubmissions')

  if (params.status) {
    query = query.where('status', '==', params.status)
  }

  const snap = await query
    .orderBy('createdAt', 'desc')
    .limit(Math.min(params.limit ?? 100, 200))
    .get()

  return snap.docs.map((doc) => asStationSubmission(doc))
}

export async function createStationSubmission(
  input: StationSubmissionInput,
  session: SessionUser,
): Promise<string> {
  const db = await getAdminDb()
  const nowIso = new Date().toISOString()
  const docRef = db.collection('stationSubmissions').doc()

  await docRef.set({
    id: docRef.id,
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
    source: 'map-click',
    createdAt: nowIso,
    updatedAt: nowIso,
  })

  return docRef.id
}

export async function voteStationSubmission(
  input: StationSubmissionVoteInput,
  session: SessionUser,
): Promise<{ promotedStationId?: string }> {
  const db = await getAdminDb()
  const submissionRef = db.collection('stationSubmissions').doc(input.submissionId)
  const voteRef = submissionRef.collection('votes').doc(session.uid)
  const stationRef = db.collection('stations').doc(`community-${input.submissionId}`)

  const promotedStationId = await db.runTransaction(async (tx) => {
    const snap = await tx.get(submissionRef)
    if (!snap.exists) throw new Error('Station submission not found')

    const submission = asStationSubmission(snap)
    if (submission.status !== 'pending') throw new Error('This station submission is already closed')
    if (submission.submittedBy === session.uid) throw new Error('Other users must validate your submitted station')

    const existingVote = await tx.get(voteRef)
    if (existingVote.exists) throw new Error('You already voted on this station')

    const nowIso = new Date().toISOString()
    tx.set(voteRef, {
      userId: session.uid,
      voteType: input.voteType,
      votedAt: nowIso,
    })

    if (input.voteType === 'legit') {
      const newCount = submission.legitCount + 1
      tx.update(submissionRef, {
        legitCount: FieldValue.increment(1),
        updatedAt: nowIso,
      })

      if (newCount >= submission.legitThreshold) {
        return promoteSubmissionInTransaction(
          tx,
          submissionRef,
          stationRef,
          input.submissionId,
          { ...submission, legitCount: newCount },
          nowIso,
          'community',
        )
      }

      return undefined
    }

    const newRejectCount = submission.notLegitCount + 1
    tx.update(submissionRef, {
      notLegitCount: FieldValue.increment(1),
      status: newRejectCount >= submission.rejectThreshold ? 'rejected' : 'pending',
      rejectedAt: newRejectCount >= submission.rejectThreshold ? nowIso : null,
      rejectedBy: newRejectCount >= submission.rejectThreshold ? 'community' : null,
      updatedAt: nowIso,
    })

    return undefined
  })

  return promotedStationId ? { promotedStationId } : {}
}

export async function approveStationSubmission(
  submissionId: string,
  session: SessionUser,
): Promise<{ promotedStationId: string }> {
  const db = await getAdminDb()
  const submissionRef = db.collection('stationSubmissions').doc(submissionId)
  const stationRef = db.collection('stations').doc(`community-${submissionId}`)

  const promotedStationId = await db.runTransaction(async (tx) => {
    const snap = await tx.get(submissionRef)
    if (!snap.exists) throw new Error('Station submission not found')

    const submission = asStationSubmission(snap)
    if (submission.status === 'approved' && submission.promotedStationId) {
      return submission.promotedStationId
    }

    return promoteSubmissionInTransaction(
      tx,
      submissionRef,
      stationRef,
      submissionId,
      submission,
      new Date().toISOString(),
      session.uid,
    )
  })

  return { promotedStationId }
}

export async function rejectStationSubmission(submissionId: string, session: SessionUser): Promise<void> {
  const db = await getAdminDb()
  await db.collection('stationSubmissions').doc(submissionId).update({
    status: 'rejected',
    rejectedAt: new Date().toISOString(),
    rejectedBy: session.uid,
    updatedAt: new Date().toISOString(),
  })
}

export function isStationSubmissionVoteType(value: string | null): value is StationSubmissionVoteType {
  return value === 'legit' || value === 'not_legit'
}

export function isStationSubmissionStatus(value: string | null): value is StationSubmissionStatus {
  return value === 'pending' || value === 'approved' || value === 'rejected'
}
