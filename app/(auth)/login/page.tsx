import Link from 'next/link'
import { LoginForm } from '@/components/auth/login-form'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'

export default function LoginPage() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h1 className="text-xl font-semibold text-foreground">Sign in</h1>
      <p className="mt-1 text-sm text-muted">Access your account to view live fuel prices and reports.</p>

      <div className="mt-5 space-y-3">
        <LoginForm />
        <GoogleSignInButton />
      </div>

      <p className="mt-4 text-center text-sm text-muted">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-medium text-fuel-green hover:underline">
          Create one
        </Link>
      </p>
    </div>
  )
}
