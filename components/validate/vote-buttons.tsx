'use client'

import { useState, useOptimistic, startTransition } from 'react'
import { Button } from '@/components/ui/button'
import { castVoteAction } from '@/app/_actions/validations'
import type { VoteType } from '@/types/report'

interface VoteButtonsProps {
  reportId: string
  disabled?: boolean
}

type VoteState = { voted: boolean; type: VoteType | null }

export function VoteButtons({ reportId, disabled }: VoteButtonsProps) {
  const [voted, setVoted] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [optimistic, applyOptimistic] = useOptimistic<VoteState, VoteType>(
    { voted: false, type: null },
    (_, type) => ({ voted: true, type })
  )

  const handleVote = async (voteType: VoteType) => {
    if (voted || disabled || pending) return
    setError(null)
    setPending(true)

    startTransition(() => applyOptimistic(voteType))

    try {
      const result = await castVoteAction({ reportId, voteType })
      if (result?.error) {
        setError(result.error)
      } else {
        setVoted(true)
      }
    } catch {
      setError('Failed to cast vote. Please try again.')
    } finally {
      setPending(false)
    }
  }

  if (optimistic.voted || voted) {
    return <p className="text-sm text-fuel-green font-medium">✓ Vote recorded</p>
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="primary"
          onClick={() => handleVote('confirm')}
          loading={pending}
          disabled={disabled}
          className="flex-1"
        >
          ✓ Confirm
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => handleVote('reject')}
          loading={pending}
          disabled={disabled}
          className="flex-1"
        >
          ✗ Reject
        </Button>
        <Button
          size="sm"
          variant="danger"
          onClick={() => handleVote('flag')}
          loading={pending}
          disabled={disabled}
        >
          ⚑ Flag
        </Button>
      </div>
      {error && <p className="text-xs text-fuel-red">{error}</p>}
    </div>
  )
}
