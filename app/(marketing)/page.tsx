import Link from 'next/link'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'

const features = [
  {
    icon: 'ri-map-pin-2-line',
    title: 'Locate Stations',
    description: 'Find gas stations near you with GPS or browse by province and city.',
  },
  {
    icon: 'ri-group-line',
    title: 'Community Reports',
    description: 'Submit local prices and help others find accurate fuel costs.',
  },
  {
    icon: 'ri-checkbox-circle-line',
    title: '3-Person Validation',
    description: 'Prices are verified by at least 3 independent users before going live.',
  },
  {
    icon: 'ri-bar-chart-box-line',
    title: 'Price History',
    description: 'Track how fuel prices change over time at your favorite stations.',
  },
]

const stats = [
  { val: '500+', label: 'Stations tracked' },
  { val: '3x', label: 'Verification required' },
  { val: '24/7', label: 'Live updates' },
]

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#e5e7eb] bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-[#0a0a0a]">
                <i className="ri-gas-station-fill text-xs text-white" />
              </div>
              <span className="text-sm font-semibold tracking-[-0.01em] text-[#0a0a0a]">GASTOS</span>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center rounded-md bg-[#0a0a0a] px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a1a1a]"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-4 py-24 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-[#f9fafb] px-3 py-1 text-xs font-medium text-[#6b7280] mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-[#16a34a]" />
            Community-powered fuel tracking
          </div>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-[-0.03em] text-[#0a0a0a] leading-[1.1] mb-5">
            Know fuel prices<br />
            <span className="text-[#16a34a]">before you go</span>
          </h1>
          <p className="text-lg text-[#6b7280] mb-8 max-w-lg mx-auto leading-relaxed">
            Live, verified fuel prices across the Philippines — tracked and reported
            by real people in your community.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <GoogleSignInButton variant="primary" size="lg" className="w-full sm:w-auto" />
            <Link
              href="/stations/nearby"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-[#e5e7eb] bg-white px-5 py-2.5 text-sm font-medium text-[#374151] transition-colors hover:bg-[#f9fafb] w-full sm:w-auto"
            >
              <i className="ri-map-pin-2-line" />
              Browse stations
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-[#e5e7eb] bg-[#f9fafb]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 divide-x divide-[#e5e7eb]">
            {stats.map((s) => (
              <div key={s.label} className="py-8 px-4 text-center">
                <div className="text-3xl font-semibold tracking-[-0.02em] text-[#0a0a0a]">{s.val}</div>
                <div className="text-sm text-[#6b7280] mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold tracking-[-0.025em] text-[#0a0a0a]">How it works</h2>
            <p className="mt-3 text-[#6b7280]">Accurate prices powered by the community</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="rounded-lg border border-[#e5e7eb] bg-white p-5 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#f3f4f6] mb-4">
                  <i className={`${f.icon} text-base text-[#374151]`} />
                </div>
                <h3 className="text-sm font-semibold text-[#0a0a0a] mb-1">{f.title}</h3>
                <p className="text-sm text-[#6b7280] leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-[#0a0a0a]">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-3xl font-semibold tracking-[-0.025em] text-white mb-3">
            Ready to save on fuel?
          </h2>
          <p className="text-[#9ca3af] mb-8">
            Join thousands of Filipinos who track fuel prices together.
          </p>
          <GoogleSignInButton size="lg" className="mx-auto" />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e5e7eb] py-6 px-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between text-xs text-[#9ca3af]">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-[#0a0a0a]">
              <i className="ri-gas-station-fill text-[10px] text-white" />
            </div>
            <span>GASTOS</span>
          </div>
          <span>Community-powered fuel price tracking</span>
        </div>
      </footer>
    </div>
  )
}
