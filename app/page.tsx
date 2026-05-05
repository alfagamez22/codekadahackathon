import { readSession, setDevSessionCookie } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { upsertUser } from '@/lib/db/queries/users'

export default async function RootPage() {
  let session = await readSession()
  
  if (!session) {
    try {
      // Auto-create dev session
      await setDevSessionCookie()
      await upsertUser({
        id: 'dev-user-123',
        displayName: 'Dev User',
        email: 'dev@test.com',
        photoURL: null,
        role: 'user',
      })
      session = await readSession()
    } catch (error) {
      console.error('Failed to create dev session:', error)
    }
  }
  
  redirect('/dashboard')
}
