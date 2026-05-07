'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { deleteStationAction } from '@/app/_actions/stations'
import type { StationListItem } from '@/types/station'

interface StationEditorProps {
  stations: StationListItem[]
}

export function StationEditor({ stations }: StationEditorProps) {
  const [pending, setPending] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this station? This cannot be undone.')) return
    setPending(id)
    await deleteStationAction(id)
    setPending(null)
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 font-medium text-muted">Name</th>
            <th className="text-left py-2 font-medium text-muted">Brand</th>
            <th className="text-left py-2 font-medium text-muted">City</th>
            <th className="text-left py-2 font-medium text-muted">Province</th>
            <th className="text-right py-2 font-medium text-muted">Actions</th>
          </tr>
        </thead>
        <tbody>
          {stations.map((station, i) => {
            const rowId = station.id || `${station.name}-${station.city}-${i}`
            const actionableId = station.id || null
            return (
            <tr key={rowId} className="border-b border-border last:border-0">
              <td className="py-3 font-medium">{station.name}</td>
              <td className="py-3 text-muted">{station.brand ?? '—'}</td>
              <td className="py-3">{station.city}</td>
              <td className="py-3">{station.province}</td>
              <td className="py-3 text-right">
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => actionableId && handleDelete(actionableId)}
                  loading={actionableId !== null && pending === actionableId}
                  disabled={actionableId === null}
                >
                  Delete
                </Button>
              </td>
            </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
