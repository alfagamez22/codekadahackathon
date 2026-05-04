import * as admin from 'firebase-admin'

export async function sendPriceUpdateNotification(params: {
  stationName: string
  fuelType: string
  newPrice: number
  tokens: string[]
}) {
  if (params.tokens.length === 0) return

  const message: admin.messaging.MulticastMessage = {
    tokens: params.tokens,
    notification: {
      title: `Price Update — ${params.stationName}`,
      body: `${params.fuelType} is now ₱${params.newPrice.toFixed(2)}/L`,
    },
    data: {
      type: 'price_update',
      stationName: params.stationName,
      fuelType: params.fuelType,
      newPrice: String(params.newPrice),
    },
    webpush: {
      notification: {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        requireInteraction: false,
      },
      fcmOptions: {
        link: '/',
      },
    },
  }

  const response = await admin.messaging().sendEachForMulticast(message)
  console.log(`FCM sent: ${response.successCount} success, ${response.failureCount} failure`)
}
