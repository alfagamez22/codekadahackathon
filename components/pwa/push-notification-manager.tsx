'use client'

import { usePushNotifications } from '@/hooks/use-push-notifications'
import { Button } from '@/components/ui/button'

export function PushNotificationManager() {
  const { subscribe, unsubscribe, subscribing, subscribed, error } = usePushNotifications()

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-medium">Price Alerts</div>
      <p className="text-xs text-muted">Get notified when prices are updated at stations you follow.</p>
      {subscribed ? (
        <Button size="sm" variant="secondary" onClick={unsubscribe}>
          Disable Notifications
        </Button>
      ) : (
        <Button size="sm" onClick={subscribe} loading={subscribing}>
          Enable Notifications
        </Button>
      )}
      {error && <p className="text-xs text-fuel-red">{error}</p>}
    </div>
  )
}
