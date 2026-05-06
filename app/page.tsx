import { readSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'

export default async function RootPage() {
  const session = await readSession()

  if (!session) {
    redirect('/login')
  }

  redirect('/dashboard')
}
