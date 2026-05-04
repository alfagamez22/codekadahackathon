'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmail, syncServerSession } from '@/lib/firebase/auth'
import { signInSchema } from '@/lib/utils/validators'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/providers/toast-provider'

export function LoginForm() {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = { email: String(formData.get('email')), password: String(formData.get('password')) }

    const parsed = signInSchema.safeParse(data)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      parsed.error.issues.forEach((i) => { if (i.path[0]) fieldErrors[String(i.path[0])] = i.message })
      setErrors(fieldErrors)
      return
    }

    setErrors({})
    setLoading(true)
    try {
      const user = await signInWithEmail(data.email, data.password)
      await syncServerSession(user)
      router.replace('/dashboard')
      router.refresh()
    } catch {
      showToast('Invalid email or password', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input name="email" type="email" label="Email" placeholder="you@example.com" error={errors.email} autoComplete="email" required />
      <Input name="password" type="password" label="Password" placeholder="••••••••" error={errors.password} autoComplete="current-password" required />
      <Button type="submit" loading={loading} className="w-full mt-2">
        Sign in
      </Button>
    </form>
  )
}
