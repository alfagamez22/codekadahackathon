import 'server-only'
import { mockUsers, mockStats } from '@/lib/mock-data'
import type { UserProfile } from '@/types/auth'
import type { UserRole } from '@/types/auth'

export async function getUser(id: string): Promise<UserProfile | null> {
  return mockUsers.find((u) => u.uid === id) ?? null
}

export async function upsertUser(data: {
  id: string
  displayName?: string | null
  email?: string | null
  photoURL?: string | null
  role?: UserRole
}): Promise<void> {
  const nowIso = new Date().toISOString()
  const idx = mockUsers.findIndex((u) => u.uid === data.id)

  if (idx === -1) {
    mockUsers.push({
      uid: data.id,
      displayName: data.displayName ?? null,
      email: data.email ?? null,
      photoURL: data.photoURL ?? null,
      role: data.role ?? 'user',
      trustScore: 0,
      reportCount: 0,
      confirmedReportCount: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    })
    mockStats.userCount += 1
  } else {
    const updates: Partial<UserProfile> = { updatedAt: nowIso }
    if (data.displayName !== undefined) updates.displayName = data.displayName
    if (data.email !== undefined) updates.email = data.email
    if (data.photoURL !== undefined) updates.photoURL = data.photoURL
    if (data.role !== undefined) updates.role = data.role
    mockUsers[idx] = { ...mockUsers[idx], ...updates }
  }
}

export async function updateUserRole(id: string, role: UserRole): Promise<void> {
  const idx = mockUsers.findIndex((u) => u.uid === id)
  if (idx !== -1) {
    mockUsers[idx] = { ...mockUsers[idx], role, updatedAt: new Date().toISOString() }
  }
}

export async function incrementUserReportCount(id: string, confirmed = false): Promise<void> {
  const idx = mockUsers.findIndex((u) => u.uid === id)
  if (idx === -1) return
  const user = mockUsers[idx]
  mockUsers[idx] = {
    ...user,
    reportCount: user.reportCount + 1,
    confirmedReportCount: confirmed ? user.confirmedReportCount + 1 : user.confirmedReportCount,
    trustScore: confirmed ? user.trustScore + 5 : user.trustScore,
    updatedAt: new Date().toISOString(),
  }
}

export async function listUsers(params: {
  page?: number
  pageSize?: number
  role?: UserRole
}): Promise<{ users: UserProfile[]; total: number }> {
  const { page = 1, pageSize = 20, role } = params

  let all = [...mockUsers]
  if (role) all = all.filter((u) => u.role === role)
  all.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))

  const total = all.length
  const offset = (page - 1) * pageSize
  return { users: all.slice(offset, offset + pageSize), total }
}
