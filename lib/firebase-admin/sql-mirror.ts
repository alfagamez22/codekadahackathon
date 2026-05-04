import 'server-only'

import { adminDb } from './firestore'
import type { UserProfile } from '@/types/auth'
import type { FuelPrice, PriceHistory, PriceSnapshot } from '@/types/price'
import type { Station } from '@/types/station'

function withMirrorMetadata<T extends object>(data: T): T & { mirroredAt: string } {
  return {
    ...data,
    mirroredAt: new Date().toISOString(),
  }
}

export async function mirrorUserToFirestore(user: UserProfile): Promise<void> {
  await adminDb.collection('users').doc(user.uid).set(withMirrorMetadata(user), { merge: true })
}

export async function mirrorStationToFirestore(station: Station): Promise<void> {
  await adminDb.collection('stations').doc(station.id).set(withMirrorMetadata(station), { merge: true })
}

export async function deleteStationFromFirestore(stationId: string): Promise<void> {
  await adminDb.collection('stations').doc(stationId).delete().catch(() => undefined)
}

export async function mirrorFuelPriceToFirestore(price: FuelPrice): Promise<void> {
  await adminDb.collection('fuelPrices').doc(price.id).set(withMirrorMetadata(price), { merge: true })
}

export async function deleteFuelPricesByStationFromFirestore(stationId: string): Promise<void> {
  const snap = await adminDb.collection('fuelPrices').where('stationId', '==', stationId).get()
  if (snap.empty) return

  const batch = adminDb.batch()
  snap.docs.forEach((doc) => batch.delete(doc.ref))
  await batch.commit()
}

export async function mirrorPriceHistoryToFirestore(entry: PriceHistory): Promise<void> {
  await adminDb.collection('priceHistory').doc(entry.id).set(withMirrorMetadata(entry), { merge: true })
}

export async function deletePriceHistoryByStationFromFirestore(stationId: string): Promise<void> {
  const snap = await adminDb.collection('priceHistory').where('stationId', '==', stationId).get()
  if (snap.empty) return

  const batch = adminDb.batch()
  snap.docs.forEach((doc) => batch.delete(doc.ref))
  await batch.commit()
}

export async function mirrorPriceSnapshotsToFirestore(snapshots: PriceSnapshot[]): Promise<void> {
  if (snapshots.length === 0) return

  const batch = adminDb.batch()
  snapshots.forEach((snapshot) => {
    batch.set(
      adminDb.collection('priceSnapshots').doc(snapshot.id),
      withMirrorMetadata(snapshot),
      { merge: true }
    )
  })
  await batch.commit()
}