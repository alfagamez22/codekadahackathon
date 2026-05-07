'use server'

import { updateTag } from 'next/cache'
import { requireAuth, requireRole } from '@/lib/auth/guards'
import {
  approveStationSubmission,
  createStationSubmission,
  rejectStationSubmission,
  voteStationSubmission,
} from '@/lib/firebase-admin/queries/station-submissions'
import {
  stationSubmissionSchema,
  stationSubmissionVoteSchema,
  type StationSubmissionInput,
  type StationSubmissionVoteInput,
} from '@/lib/utils/validators'

export async function submitStationSubmissionAction(input: StationSubmissionInput) {
  const session = await requireAuth()
  const parsed = stationSubmissionSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  try {
    const submissionId = await createStationSubmission(parsed.data, session)
    updateTag('station-submissions')
    return { success: true, submissionId }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Could not submit this station.',
    }
  }
}

export async function voteStationSubmissionAction(input: StationSubmissionVoteInput) {
  const session = await requireAuth()
  const parsed = stationSubmissionVoteSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  try {
    const result = await voteStationSubmission(parsed.data, session)
    updateTag('station-submissions')
    if (result.promotedStationId) updateTag('stations')
    return { success: true, promotedStationId: result.promotedStationId }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Vote failed.',
    }
  }
}

export async function adminApproveStationSubmissionAction(submissionId: string) {
  const session = await requireRole(['admin'])

  try {
    const result = await approveStationSubmission(submissionId, session)
    // audit log — no-op in mock mode
    updateTag('station-submissions')
    updateTag('stations')
    return { success: true, promotedStationId: result.promotedStationId }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Could not approve this station submission.',
    }
  }
}

export async function adminRejectStationSubmissionAction(submissionId: string) {
  const session = await requireRole(['admin'])

  try {
    await rejectStationSubmission(submissionId, session)
    // audit log — no-op in mock mode
    updateTag('station-submissions')
    return { success: true }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Could not reject this station submission.',
    }
  }
}
