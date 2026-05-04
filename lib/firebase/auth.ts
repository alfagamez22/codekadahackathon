import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { getFirebaseAuth } from './client'

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

export async function syncServerSession(user: User): Promise<void> {
  const idToken = await user.getIdToken()
  const response = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ idToken }),
  })

  if (response.ok) return

  const payload = (await response.json().catch(() => null)) as { error?: string } | null
  throw new Error(payload?.error ?? 'Failed to create server session')
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const auth = getFirebaseAuth()
  const result = await signInWithEmailAndPassword(auth, email, password)
  return result.user
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  const auth = getFirebaseAuth()
  const result = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(result.user, { displayName })
  return result.user
}

export async function signInWithGoogle(): Promise<User> {
  const auth = getFirebaseAuth()
  const result = await signInWithPopup(auth, googleProvider)
  return result.user
}

export async function signOut(): Promise<void> {
  const auth = getFirebaseAuth()
  await firebaseSignOut(auth)
}

export async function getIdToken(): Promise<string | null> {
  const auth = getFirebaseAuth()
  const user = auth.currentUser
  if (!user) return null
  return user.getIdToken()
}
