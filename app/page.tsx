import { readSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'

export default async function RootPage() {
  const session = await readSession()
  
  if (session) {
    // If authenticated, redirect to dashboard
    redirect('/dashboard')
  } else {
    // If not authenticated, redirect to marketing page
    redirect('/login')
  }
}
