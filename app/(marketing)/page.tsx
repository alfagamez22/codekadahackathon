import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'

const features = [
  { icon: '📍', title: 'Locate Stations', description: 'Find gas stations near you with GPS or browse by province and city.' },
  { icon: '👥', title: 'Community Reports', description: 'Submit local prices and help others find accurate fuel costs.' },
  { icon: '✅', title: '3-Person Validation', description: 'Prices are verified by at least 3 independent users before going live.' },
  { icon: '📊', title: 'Price History', description: 'Track how fuel prices change over time at your favorite stations.' },
]

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="py-20 px-4 text-center bg-gradient-to-b from-green-50 to-white">
        <div className="mx-auto max-w-3xl">
          <div className="text-6xl mb-4">⛽</div>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Know Before You Go
          </h1>
          <p className="text-lg text-muted mb-8 max-w-xl mx-auto">
            Gas Price Tracker PH is the community-powered app for finding and comparing fuel prices
            across the Philippines — live, accurate, and verified by real people.
          </p>
          <GoogleSignInButton variant="primary" size="lg" className="mx-auto" />
        </div>
      </section>

      {/* Price badges preview */}
      <section className="py-10 px-4 border-y border-border bg-gray-50">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm text-muted mb-4 font-medium uppercase tracking-wide">Price source labels</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="community-verified" />
            <Badge variant="admin-verified" />
            <Badge variant="pending-update" />
            <Badge variant="baseline" />
            <Badge variant="stale" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold text-center text-foreground mb-10">
            How it works
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="text-center">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted">{f.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-fuel-green text-white text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="text-2xl font-bold mb-3">Ready to save on fuel?</h2>
          <p className="mb-6 opacity-90">Join thousands of Filipinos who track fuel prices together.</p>
          <GoogleSignInButton size="lg" className="mx-auto bg-white" />
        </div>
      </section>
    </div>
  )
}
