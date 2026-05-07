import { redirect } from 'next/navigation'

export default function AdminStationsPage() {
  redirect('/dashboard?panel=stations')
}
