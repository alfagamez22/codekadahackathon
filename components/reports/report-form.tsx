'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { submitPriceReportAction } from '@/app/_actions/reports'
import { formatFuelType } from '@/lib/utils/format'
import { PhotoUpload } from './photo-upload'
import { cn } from '@/lib/utils'

interface ReportFormProps {
  stationId: string
  fuelTypes: string[]
  userId: string
}

export function ReportForm({ stationId, fuelTypes, userId }: ReportFormProps) {
  const router = useRouter()
  const [selectedFuel, setSelectedFuel] = useState(fuelTypes[0] ?? '')
  const [price, setPrice] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      const result = await submitPriceReportAction({
        stationId,
        fuelType: selectedFuel as never,
        reportedPrice: parseFloat(price),
        evidenceUrl: photoUrl ?? undefined,
      })
      if (result?.error) {
        setError(result.error)
      } else {
        router.push(`/stations/${stationId}`)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Fuel Type</label>
          <div className="flex flex-wrap gap-2">
            {fuelTypes.map((ft) => (
              <button
                key={ft}
                type="button"
                onClick={() => setSelectedFuel(ft)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium border transition-colors',
                  selectedFuel === ft
                    ? 'bg-[#0a0a0a] text-white border-[#0a0a0a]'
                    : 'bg-background border-border text-foreground hover:bg-muted',
                )}
              >
                {formatFuelType(ft)}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Price per Liter (₱)"
          type="number"
          min="10"
          max="500"
          step="0.01"
          placeholder="e.g. 58.75"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Photo Evidence (optional)</label>
          <PhotoUpload userId={userId} onUpload={setPhotoUrl} />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" loading={pending} className="flex-1">
            Submit Report
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  )
}
