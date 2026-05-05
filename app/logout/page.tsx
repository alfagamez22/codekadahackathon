import { clearSessionCookie } from '@/lib/auth/session'
import { redirect } from 'next/navigation'

export default async function LogoutPage() {
  await clearSessionCookie()
  redirect('/login')
}
