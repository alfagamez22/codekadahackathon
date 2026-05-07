'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  submitStationSubmissionAction,
  voteStationSubmissionAction,
} from '@/app/_actions/station-submissions'
import type { FuelType } from '@/types/station'
import type { StationSubmissionListItem } from '@/types/station-submission'

type DraftPoint = { lat: number; lng: number } | null

interface StationSubmissionPanelProps {
  isPlotting: boolean
  draftPoint: DraftPoint
  submissions: StationSubmissionListItem[]
  selectedSubmissionId: string | null
  onStartPlotting: () => void
  onCancelPlotting: () => void
  onClearDraft: () => void
  onSaved: () => void
  onSelectSubmission: (id: string | null) => void
}

const FUEL_OPTIONS: Array<{ value: FuelType; label: string }> = [
  { value: 'diesel', label: 'Diesel' },
  { value: 'gasoline', label: 'Gasoline' },
  { value: 'premium', label: 'Premium gasoline' },
  { value: 'kerosene', label: 'Kerosene' },
  { value: 'lpg', label: 'LPG' },
]

export function StationSubmissionPanel({
  isPlotting,
  draftPoint,
  submissions,
  selectedSubmissionId,
  onStartPlotting,
  onCancelPlotting,
  onClearDraft,
  onSaved,
  onSelectSubmission,
}: StationSubmissionPanelProps) {
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('Metro Manila')
  const [province, setProvince] = useState('NCR')
  const [fuelTypes, setFuelTypes] = useState<FuelType[]>(['diesel', 'gasoline'])
  const [pending, setPending] = useState(false)
  const [votingId, setVotingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const selectedSubmission = useMemo(
    () => submissions.find((submission) => submission.id === selectedSubmissionId) ?? null,
    [selectedSubmissionId, submissions],
  )

  const toggleFuelType = (fuelType: FuelType) => {
    setFuelTypes((current) => {
      if (current.includes(fuelType)) {
        return current.length === 1 ? current : current.filter((item) => item !== fuelType)
      }
      return [...current, fuelType]
    })
  }

  const resetForm = () => {
    setName('')
    setBrand('')
    setAddress('')
    setCity('Metro Manila')
    setProvince('NCR')
    setFuelTypes(['diesel', 'gasoline'])
  }

  const handleSubmit = async () => {
    if (!draftPoint) {
      setMessage('Click the map first to pin the station location.')
      return
    }

    setPending(true)
    setMessage(null)
    const result = await submitStationSubmissionAction({
      name,
      brand: brand || null,
      address: address || null,
      city,
      province,
      latitude: draftPoint.lat,
      longitude: draftPoint.lng,
      fuelTypes,
    })
    setPending(false)

    if (result.error) {
      setMessage(result.error)
      return
    }

    resetForm()
    onClearDraft()
    onSaved()
    setMessage('Station submitted. It now needs 46 legit votes or admin approval before it becomes official.')
  }

  const handleVote = async (submissionId: string, voteType: 'legit' | 'not_legit') => {
    setVotingId(`${submissionId}:${voteType}`)
    setMessage(null)
    const result = await voteStationSubmissionAction({ submissionId, voteType })
    setVotingId(null)

    if (result.error) {
      setMessage(result.error)
      return
    }

    onSaved()
    setMessage(
      result.promotedStationId
        ? 'This station reached the legit threshold and was added to official stations.'
        : 'Vote recorded.',
    )
  }

  return (
    <div className="mb-4 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Crowdsource a gas station</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Plot a missing station on the map. Community votes or admin approval can promote it into official stations.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={isPlotting ? 'secondary' : 'primary'}
            onClick={isPlotting ? onCancelPlotting : onStartPlotting}
          >
            {isPlotting ? 'Cancel plot' : 'Add gas station'}
          </Button>
          {draftPoint && (
            <Button type="button" size="sm" variant="ghost" onClick={onClearDraft}>
              Clear pin
            </Button>
          )}
        </div>
      </div>

      {isPlotting && (
        <div className="mt-3 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-sm text-blue-700">
          Click the exact location on the map to place the new station pin.
        </div>
      )}

      {draftPoint && (
        <div className="mt-4 grid gap-3 rounded-lg border border-border bg-background p-3 lg:grid-cols-2">
          <div className="lg:col-span-2 grid gap-2 sm:grid-cols-2">
            <Input label="Station name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Example: New Seaoil Branch" />
            <Input label="Brand" value={brand} onChange={(event) => setBrand(event.target.value)} placeholder="Shell, Petron, Phoenix..." />
          </div>
          <Input label="Address or landmark" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Street, barangay, nearby landmark" />
          <div className="grid gap-2 sm:grid-cols-2">
            <Input label="City" value={city} onChange={(event) => setCity(event.target.value)} />
            <Input label="Province" value={province} onChange={(event) => setProvince(event.target.value)} />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input label="Latitude" value={draftPoint.lat.toFixed(6)} readOnly />
            <Input label="Longitude" value={draftPoint.lng.toFixed(6)} readOnly />
          </div>
          <div className="lg:col-span-2">
            <div className="mb-2 text-sm font-medium text-foreground">Fuel sold</div>
            <div className="flex flex-wrap gap-2">
              {FUEL_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleFuelType(option.value)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    fuelTypes.includes(option.value)
                      ? 'border-fuel-green bg-fuel-green text-white'
                      : 'border-border bg-card text-foreground hover:border-fuel-green'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2 flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClearDraft}>
              Cancel
            </Button>
            <Button type="button" size="sm" loading={pending} onClick={handleSubmit}>
              Submit for validation
            </Button>
          </div>
        </div>
      )}

      {submissions.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 text-sm font-semibold text-foreground">Pending community validations</div>
          <div className="grid gap-2 md:grid-cols-2">
            {submissions.slice(0, 6).map((submission) => (
              <div
                key={submission.id}
                className={`rounded-lg border p-3 transition-colors ${
                  selectedSubmissionId === submission.id ? 'border-blue-500 bg-blue-500/10' : 'border-border bg-background'
                }`}
              >
                <button
                  type="button"
                  className="block w-full text-left"
                  onClick={() => onSelectSubmission(selectedSubmissionId === submission.id ? null : submission.id)}
                >
                  <span className="block text-sm font-semibold text-foreground">{submission.name}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {submission.city}, {submission.province} · {submission.latitude.toFixed(5)}, {submission.longitude.toFixed(5)}
                  </span>
                </button>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded bg-fuel-green/10 px-2 py-1 text-fuel-green">
                    Legit {submission.legitCount}/{submission.legitThreshold}
                  </div>
                  <div className="rounded bg-fuel-red/10 px-2 py-1 text-fuel-red">
                    Not legit {submission.notLegitCount}/{submission.rejectThreshold}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleVote(submission.id, 'legit')}
                    loading={votingId === `${submission.id}:legit`}
                  >
                    Legit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    onClick={() => handleVote(submission.id, 'not_legit')}
                    loading={votingId === `${submission.id}:not_legit`}
                  >
                    Not legit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedSubmission && (
        <div className="mt-3 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-700">
          Selected pending station: {selectedSubmission.name}
        </div>
      )}

      {message && (
        <div className="mt-3 rounded-lg border border-border bg-background p-3 text-sm text-muted-foreground">
          {message}
        </div>
      )}
    </div>
  )
}
