export type UserRole = 'user' | 'moderator' | 'admin' | 'superadmin'

export interface SessionUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  role: UserRole
}

export interface CustomClaims {
  role: UserRole
}

export interface UserProfile {
  uid: string
  displayName: string | null
  email: string | null
  photoURL: string | null
  role: UserRole
  trustScore: number
  reportCount: number
  confirmedReportCount: number
  createdAt: string
  updatedAt: string
}
