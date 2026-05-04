import Link from 'next/link'
import { RegisterForm } from '@/components/auth/register-form'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'
import { Card } from '@/components/ui/card'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Create account' }

export default function RegisterPage() {
  return (
    <Card padding="lg">
      <h1 className="text-xl font-bold text-foreground mb-1">Create your account</h1>
      <p className="text-sm text-muted mb-6">Join the community and start tracking fuel prices.</p>
      <RegisterForm />
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center text-xs text-muted"><span className="bg-card px-2">or</span></div>
      </div>
      <GoogleSignInButton />
      <p className="mt-4 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link href="/login" className="text-fuel-green hover:underline font-medium">Sign in</Link>
      </p>
    </Card>
  )
}
