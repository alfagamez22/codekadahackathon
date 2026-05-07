import Link from 'next/link'
import { RegisterForm } from '@/components/auth/register-form'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'

export default function RegisterPage() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h1 className="text-xl font-semibold text-foreground">Create account</h1>
      <p className="mt-1 text-sm text-muted">Join Gas Price Tracker PH to report and validate prices.</p>

      <div className="mt-5 space-y-3">
        <RegisterForm />
        <GoogleSignInButton label="Continue with Google" />
      </div>

      <p className="mt-4 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-fuel-green hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
