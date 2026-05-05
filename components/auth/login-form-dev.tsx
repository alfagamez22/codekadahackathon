'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/providers/toast-provider'

export function LoginFormDev() {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    
    setLoading(true)
    try {
      const response = await fetch('/api/auth/session-dev', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (response.ok) {
        showToast('Dev session created', 'success')
        router.push('/dashboard')
      } else {
        showToast('Session creation failed', 'error')
      }
    } catch (error) {
      showToast('Error logging in', 'error')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Button type="submit" loading={loading} className="w-full mt-2">
        Enter Dev Mode (No Credentials)
      </Button>
    </form>
  )
}
