import { readSession, setDevSessionCookie } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { upsertUser } from '@/lib/db/queries/users'

export default async function RootPage() {
  const session = await readSession()
  
  if (!session) {
    redirect('/login')
  }
  
  redirect('/dashboard')
}
