import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'
import { Card } from '@/components/ui/card'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Sign in' }

export default function LoginPage() {
  return (
    <Card padding="lg">
      <h1 className="text-xl font-bold text-foreground mb-1">Continue with Google</h1>
      <p className="text-sm text-muted mb-6">
        Sign in with Google to access the app. First-time sign-in automatically creates your account.
      </p>
      <GoogleSignInButton label="Continue with Google" />
    </Card>
  )
}
