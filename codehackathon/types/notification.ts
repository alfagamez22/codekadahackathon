export interface FCMSubscription {
  userId: string
  token: string
  createdAt: string
}

export interface PushPayload {
  title: string
  body: string
  icon?: string
  url?: string
  stationId?: string
}
