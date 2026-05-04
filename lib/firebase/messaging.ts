import { getMessagingClient } from './client'

export async function getFCMToken(): Promise<string | null> {
  const messaging = await getMessagingClient()
  if (!messaging) return null

  try {
    const { getToken } = await import('firebase/messaging')
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    })
    return token || null
  } catch {
    return null
  }
}

export async function setupForegroundMessages(
  callback: (payload: { title: string; body: string; url?: string }) => void
) {
  const messaging = await getMessagingClient()
  if (!messaging) return

  const { onMessage } = await import('firebase/messaging')
  onMessage(messaging, (payload) => {
    callback({
      title: payload.notification?.title ?? 'Gas Price Tracker',
      body: payload.notification?.body ?? '',
      url: payload.data?.url,
    })
  })
}
