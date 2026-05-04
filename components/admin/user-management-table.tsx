'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { assignRoleAction } from '@/app/_actions/users'
import { Badge } from '@/components/ui/badge'
import type { UserProfile } from '@/types/auth'
import type { UserRole } from '@/types/auth'

interface UserManagementTableProps {
  users: UserProfile[]
}

export function UserManagementTable({ users }: UserManagementTableProps) {
  const [pending, setPending] = useState<string | null>(null)

  const handleRoleChange = async (uid: string, role: UserRole) => {
    setPending(uid)
    await assignRoleAction(uid, role)
    setPending(null)
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 font-medium text-muted">User</th>
            <th className="text-left py-2 font-medium text-muted">Email</th>
            <th className="text-left py-2 font-medium text-muted">Role</th>
            <th className="text-right py-2 font-medium text-muted">Reports</th>
            <th className="text-right py-2 font-medium text-muted">Trust Score</th>
            <th className="text-right py-2 font-medium text-muted">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.uid} className="border-b border-border last:border-0">
              <td className="py-3 font-medium">{user.displayName ?? '—'}</td>
              <td className="py-3 text-muted">{user.email ?? '—'}</td>
              <td className="py-3">
                <Badge variant={user.role === 'superadmin' ? 'superadmin' : user.role === 'admin' ? 'admin' : user.role === 'moderator' ? 'moderator' : 'user'} label={user.role} />
              </td>
              <td className="py-3 text-right">{user.confirmedReportCount}/{user.reportCount}</td>
              <td className="py-3 text-right">{user.trustScore}</td>
              <td className="py-3 text-right">
                <div className="flex gap-1 justify-end">
                  {user.role !== 'superadmin' && user.role !== 'moderator' && (
                    <Button size="sm" variant="secondary" onClick={() => handleRoleChange(user.uid, 'moderator')} loading={pending === user.uid}>
                      Make Mod
                    </Button>
                  )}
                  {user.role !== 'superadmin' && user.role !== 'user' && (
                    <Button size="sm" variant="ghost" onClick={() => handleRoleChange(user.uid, 'user')} loading={pending === user.uid}>
                      Revoke
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
