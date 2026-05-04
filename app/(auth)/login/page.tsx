import Link from 'next/link'
import { LoginFormDev } from '@/components/auth/login-form-dev'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'
import { Card } from '@/components/ui/card'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Sign in' }

export default function LoginPage() {
  return (
    <Card padding="lg">
      <h1 className="text-xl font-bold text-foreground mb-1">Welcome back</h1>
      <p className="text-sm text-muted mb-6">Sign in to track and report fuel prices.</p>
      <LoginFormDev />
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center text-xs text-muted"><span className="bg-card px-2">or</span></div>
      </div>
      <GoogleSignInButton />
      <p className="mt-4 text-center text-sm text-muted">
        No account?{' '}
        <Link href="/auth/register" className="text-fuel-green hover:underline font-medium">Create one</Link>
      </p>
    </Card>
  )
}
