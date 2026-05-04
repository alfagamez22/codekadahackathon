'use client'

export default function StationError({ error }: { error: Error }) {
  return (
    <div className="text-center py-12">
      <div className="text-4xl mb-3">⚠️</div>
      <div className="font-semibold text-foreground mb-1">Something went wrong</div>
      <div className="text-sm text-muted">{error.message}</div>
    </div>
  )
}
