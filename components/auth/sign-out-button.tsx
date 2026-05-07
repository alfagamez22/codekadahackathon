'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/firebase/auth'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/providers/toast-provider'

interface SignOutButtonProps {
  redirectTo?: string
}

export function SignOutButton({ redirectTo = '/' }: SignOutButtonProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    setLoading(true)

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
      })

      await signOut()
      router.replace(redirectTo)
      router.refresh()
    } catch {
      showToast('Sign out failed. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={handleSignOut} loading={loading}>
      Sign out
    </Button>
  )
}
