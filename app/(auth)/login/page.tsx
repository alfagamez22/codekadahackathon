import Link from 'next/link'
import { LoginFormDev } from '@/components/auth/login-form-dev'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'
import { Card } from '@/components/ui/card'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Sign in' }

export default function LoginPage() {
  return (
    <Card padding="lg">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Sign in</h1>
          <p className="text-sm text-muted-foreground mt-1">Track and report fuel prices across the community.</p>
        </div>

        <GoogleSignInButton label="Continue with Google" />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <LoginFormDev />

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-primary hover:underline font-medium">
            Create one
          </Link>
        </p>
      </div>
    </Card>
  )
}
