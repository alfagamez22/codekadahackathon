import { redirect } from 'next/navigation'

export default function AdminConfigPage() {
  redirect('/dashboard?panel=config')
}
