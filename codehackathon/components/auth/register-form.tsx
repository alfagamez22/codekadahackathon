'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signUpWithEmail, getIdToken } from '@/lib/firebase/auth'
import { signUpSchema } from '@/lib/utils/validators'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/providers/toast-provider'

export function RegisterForm() {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      displayName: String(formData.get('displayName')),
      email: String(formData.get('email')),
      password: String(formData.get('password')),
    }

    const parsed = signUpSchema.safeParse(data)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      parsed.error.issues.forEach((i) => { if (i.path[0]) fieldErrors[String(i.path[0])] = i.message })
      setErrors(fieldErrors)
      return
    }

    setErrors({})
    setLoading(true)
    try {
      await signUpWithEmail(data.email, data.password, data.displayName)
      const token = await getIdToken()
      if (token) await fetch('/api/auth/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: token }) })
      showToast('Account created successfully!', 'success')
      router.push('/dashboard')
    } catch (err: unknown) {
      const code = (err as { code?: string }).code
      if (code === 'auth/email-already-in-use') showToast('Email already registered', 'error')
      else showToast('Registration failed. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input name="displayName" label="Full Name" placeholder="Juan dela Cruz" error={errors.displayName} autoComplete="name" required />
      <Input name="email" type="email" label="Email" placeholder="you@example.com" error={errors.email} autoComplete="email" required />
      <Input name="password" type="password" label="Password" placeholder="At least 6 characters" error={errors.password} autoComplete="new-password" required />
      <Button type="submit" loading={loading} className="w-full mt-2">
        Create account
      </Button>
    </form>
  )
}
