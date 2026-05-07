import Link from 'next/link'
import { RegisterForm } from '@/components/auth/register-form'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'

export default function RegisterPage() {
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white shadow-sm p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-[-0.02em] text-[#0a0a0a]">Create an account</h1>
        <p className="mt-1 text-sm text-[#6b7280]">
          Join GASTOS to report and validate fuel prices.
        </p>
      </div>

      <div className="space-y-3">
        <GoogleSignInButton label="Continue with Google" />
      </div>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#e5e7eb]" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-2 text-[#9ca3af]">or continue with email</span>
        </div>
      </div>

      <RegisterForm />

      <p className="mt-5 text-center text-sm text-[#6b7280]">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-[#0a0a0a] hover:underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  )
}
