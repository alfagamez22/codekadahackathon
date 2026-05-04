import { PageHeader } from '@/components/layout/page-header'
import { UserManagementTable } from '@/components/admin/user-management-table'
import { listUsers } from '@/lib/db/queries/users'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'User Management' }

export default async function AdminUsersPage() {
  const { users } = await listUsers({})

  return (
    <div>
      <PageHeader title="Users" description="Manage user roles and accounts" />
      <UserManagementTable users={users} />
    </div>
  )
}
