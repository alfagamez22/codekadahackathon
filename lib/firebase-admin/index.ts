import 'server-only'
import { getApps, initializeApp, cert, getApp, type App } from 'firebase-admin/app'

function getAdminApp(): App {
  if (getApps().length > 0) return getApp()
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

export default getAdminApp
