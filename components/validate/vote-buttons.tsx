'use client'

import { useState, useOptimistic, startTransition } from 'react'
import { castVoteAction } from '@/app/_actions/validations'
import { cn } from '@/lib/utils'
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
    return (
      <div className="inline-flex items-center gap-2 rounded-md bg-[#f0fdf4] border border-[#bbf7d0] px-3 py-2 text-sm font-medium text-[#16a34a]">
        <i className="ri-checkbox-circle-line" />
        Vote recorded
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <button
          onClick={() => handleVote('confirm')}
          disabled={disabled || pending}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-[#0a0a0a] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a1a1a] disabled:opacity-50 disabled:pointer-events-none"
        >
          <i className="ri-check-line" />
          Confirm
        </button>
        <button
          onClick={() => handleVote('reject')}
          disabled={disabled || pending}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
        >
          <i className="ri-close-line" />
          Reject
        </button>
        <button
          onClick={() => handleVote('flag')}
          disabled={disabled || pending}
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-[#fef2f2] border border-[#fecaca] px-3 py-2 text-sm font-medium text-[#dc2626] transition-colors hover:bg-[#fee2e2] disabled:opacity-50 disabled:pointer-events-none"
        >
          <i className="ri-flag-line" />
          Flag
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
