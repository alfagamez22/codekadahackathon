'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { deleteStationAction } from '@/app/_actions/stations'
import {
  adminApproveStationSubmissionAction,
  adminRejectStationSubmissionAction,
} from '@/app/_actions/station-submissions'
import type { StationListItem } from '@/types/station'
import type { StationSubmissionListItem } from '@/types/station-submission'

interface StationEditorProps {
  stations: StationListItem[]
  stationSubmissions?: StationSubmissionListItem[]
}

export function StationEditor({ stations, stationSubmissions = [] }: StationEditorProps) {
  const [pending, setPending] = useState<string | null>(null)
  const [submissionPending, setSubmissionPending] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this station? This cannot be undone.')) return
    setPending(id)
    await deleteStationAction(id)
    setPending(null)
    router.refresh()
  }

  const handleApproveSubmission = async (submissionId: string) => {
    setSubmissionPending(`approve:${submissionId}`)
    setMessage(null)
    const result = await adminApproveStationSubmissionAction(submissionId)
    setSubmissionPending(null)

    if (result.error) {
      setMessage(result.error)
      return
    }

    setMessage('Station submission approved and added to official stations.')
    router.refresh()
  }

  const handleRejectSubmission = async (submissionId: string) => {
    setSubmissionPending(`reject:${submissionId}`)
    setMessage(null)
    const result = await adminRejectStationSubmissionAction(submissionId)
    setSubmissionPending(null)

    if (result.error) {
      setMessage(result.error)
      return
    }

    setMessage('Station submission rejected.')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {stationSubmissions.length > 0 && (
        <div className="rounded-xl border border-border bg-background p-4">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-foreground">Pending station submissions</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Admin approval overrides community voting and adds the station to the official stations collection.
            </p>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {stationSubmissions.map((submission) => (
              <div key={submission.id} className="rounded-lg border border-border bg-card p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground">{submission.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {submission.brand ?? 'Independent'} · {submission.city}, {submission.province}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {submission.latitude.toFixed(6)}, {submission.longitude.toFixed(6)}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center text-xs sm:min-w-36">
                    <div className="rounded bg-fuel-green/10 px-2 py-1 text-fuel-green">
                      {submission.legitCount}/{submission.legitThreshold} legit
                    </div>
                    <div className="rounded bg-fuel-red/10 px-2 py-1 text-fuel-red">
                      {submission.notLegitCount}/{submission.rejectThreshold} not
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleApproveSubmission(submission.id)}
                    loading={submissionPending === `approve:${submission.id}`}
                  >
                    Mark legit
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleRejectSubmission(submission.id)}
                    loading={submissionPending === `reject:${submission.id}`}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {message && (
        <div className="rounded-lg border border-border bg-background p-3 text-sm text-muted-foreground">
          {message}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 font-medium text-muted">Name</th>
              <th className="text-left py-2 font-medium text-muted">Brand</th>
              <th className="text-left py-2 font-medium text-muted">City</th>
              <th className="text-left py-2 font-medium text-muted">Province</th>
              <th className="text-right py-2 font-medium text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {stations.map((station, i) => {
              const rowId = station.id || `${station.name}-${station.city}-${i}`
              const actionableId = station.id || null
              return (
              <tr key={rowId} className="border-b border-border last:border-0">
                <td className="py-3 font-medium">{station.name}</td>
                <td className="py-3 text-muted">{station.brand ?? '—'}</td>
                <td className="py-3">{station.city}</td>
                <td className="py-3">{station.province}</td>
                <td className="py-3 text-right">
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => actionableId && handleDelete(actionableId)}
                    loading={actionableId !== null && pending === actionableId}
                    disabled={actionableId === null}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
