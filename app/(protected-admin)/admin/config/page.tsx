import { PageHeader } from '@/components/layout/page-header'
import { SystemConfigForm } from '@/components/admin/system-config-form'
import { getSystemConfig } from '@/lib/firebase-admin/firestore'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'System Config' }

export default async function AdminConfigPage() {
  const config = await getSystemConfig()

  return (
    <div>
      <PageHeader title="System Config" description="Configure validation thresholds and app settings" />
      <SystemConfigForm config={config} />
    </div>
  )
}
