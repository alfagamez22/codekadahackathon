import 'server-only'
import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app'

async function getAdminApp() {
  if (getApps().length > 0) return getApp()

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin environment variables')
  }

  const formattedKey = privateKey.replace(/\\n/g, '\n').replace(/"/g, '').trim()

  if (!formattedKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
    console.error('Invalid FIREBASE_ADMIN_PRIVATE_KEY format. Must start with -----BEGIN PRIVATE KEY-----')
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: formattedKey,
    }),
  })
}

export default getAdminApp
