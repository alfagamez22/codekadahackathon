/**
 * MOCK DATA — replaces all Firestore reads/writes while quota is exhausted.
 * All mutations operate on these in-memory arrays for the duration of the process.
 * Data is reset on every server restart (acceptable for dev/hackathon branch).
 */

import type { Station, StationListItem, FuelType } from '@/types/station'
import type { FuelPrice, PriceHistory, PriceSnapshot } from '@/types/price'
import type { PriceReport, ValidationVote } from '@/types/report'
import type { UserProfile } from '@/types/auth'
import type { StationSubmissionListItem } from '@/types/station-submission'

// ---------------------------------------------------------------------------
// System config (matches SystemConfig from firestore.ts)
// ---------------------------------------------------------------------------

export const mockSystemConfig = {
  minConfirmations: 4,
  flagThreshold: 3,
  reportExpiryHours: 72,
  reportCooldownHours: 6,
  priceTolerancePercent: 2,
  stalePriceDays: 7,
}

export const defaultSystemConfig = mockSystemConfig

// ---------------------------------------------------------------------------
// Stations
// ---------------------------------------------------------------------------

export const mockStations: Station[] = [
  {
    id: 'station-001',
    name: 'Petron EDSA Balintawak',
    brand: 'Petron',
    address: 'EDSA cor. Balintawak St.',
    barangay: 'Balintawak',
    city: 'Quezon City',
    province: 'Metro Manila',
    latitude: 14.6542,
    longitude: 121.0082,
    fuelTypes: ['gasoline', 'diesel', 'premium'],
    latestPrices: {
      gasoline: { price: 62.5, sourceType: 'scraped', badge: 'baseline', updatedAt: '2026-05-01T08:00:00.000Z', confirmationCount: 0 },
      diesel: { price: 55.8, sourceType: 'scraped', badge: 'baseline', updatedAt: '2026-05-01T08:00:00.000Z', confirmationCount: 0 },
      premium: { price: 67.3, sourceType: 'scraped', badge: 'baseline', updatedAt: '2026-05-01T08:00:00.000Z', confirmationCount: 0 },
    },
    lastUpdatedAt: '2026-05-01T08:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-05-01T08:00:00.000Z',
    dataSource: 'scraped',
  },
  {
    id: 'station-002',
    name: 'Shell Commonwealth Ave',
    brand: 'Shell',
    address: 'Commonwealth Ave, Batasan Hills',
    barangay: 'Batasan Hills',
    city: 'Quezon City',
    province: 'Metro Manila',
    latitude: 14.6890,
    longitude: 121.0970,
    fuelTypes: ['gasoline', 'diesel', 'premium', 'kerosene'],
    latestPrices: {
      gasoline: { price: 63.1, sourceType: 'scraped', badge: 'baseline', updatedAt: '2026-05-02T09:00:00.000Z', confirmationCount: 0 },
      diesel: { price: 56.2, sourceType: 'scraped', badge: 'baseline', updatedAt: '2026-05-02T09:00:00.000Z', confirmationCount: 0 },
      premium: { price: 68.0, sourceType: 'scraped', badge: 'baseline', updatedAt: '2026-05-02T09:00:00.000Z', confirmationCount: 0 },
      kerosene: { price: 48.5, sourceType: 'scraped', badge: 'baseline', updatedAt: '2026-05-02T09:00:00.000Z', confirmationCount: 0 },
    },
    lastUpdatedAt: '2026-05-02T09:00:00.000Z',
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-05-02T09:00:00.000Z',
    dataSource: 'scraped',
  },
  {
    id: 'station-003',
    name: 'Caltex Marcos Highway',
    brand: 'Caltex',
    address: 'Marcos Highway, Marikina',
    barangay: 'Sto. Nino',
    city: 'Marikina',
    province: 'Metro Manila',
    latitude: 14.6416,
    longitude: 121.1077,
    fuelTypes: ['gasoline', 'diesel'],
    latestPrices: {
      gasoline: { price: 61.9, sourceType: 'community', badge: 'community-verified', updatedAt: '2026-05-03T10:00:00.000Z', confirmationCount: 5 },
      diesel: { price: 55.5, sourceType: 'community', badge: 'community-verified', updatedAt: '2026-05-03T10:00:00.000Z', confirmationCount: 4 },
    },
    lastUpdatedAt: '2026-05-03T10:00:00.000Z',
    createdAt: '2026-01-03T00:00:00.000Z',
    updatedAt: '2026-05-03T10:00:00.000Z',
    dataSource: 'scraped',
  },
  {
    id: 'station-004',
    name: 'Jetti Ortigas Ave',
    brand: 'Jetti',
    address: 'Ortigas Ave Extension',
    barangay: 'Rosario',
    city: 'Pasig',
    province: 'Metro Manila',
    latitude: 14.5753,
    longitude: 121.0837,
    fuelTypes: ['gasoline', 'diesel', 'lpg'],
    latestPrices: {
      gasoline: { price: 60.5, sourceType: 'scraped', badge: 'baseline', updatedAt: '2026-05-01T07:00:00.000Z', confirmationCount: 0 },
      diesel: { price: 54.9, sourceType: 'scraped', badge: 'baseline', updatedAt: '2026-05-01T07:00:00.000Z', confirmationCount: 0 },
      lpg: { price: 850.0, sourceType: 'scraped', badge: 'baseline', updatedAt: '2026-05-01T07:00:00.000Z', confirmationCount: 0 },
    },
    lastUpdatedAt: '2026-05-01T07:00:00.000Z',
    createdAt: '2026-01-04T00:00:00.000Z',
    updatedAt: '2026-05-01T07:00:00.000Z',
    dataSource: 'scraped',
  },
  {
    id: 'station-005',
    name: 'Phoenix BGC',
    brand: 'Phoenix',
    address: '9th Ave, Bonifacio Global City',
    barangay: 'BGC',
    city: 'Taguig',
    province: 'Metro Manila',
    latitude: 14.5515,
    longitude: 121.0504,
    fuelTypes: ['gasoline', 'diesel', 'premium'],
    latestPrices: {
      gasoline: { price: 64.0, sourceType: 'admin', badge: 'admin-verified', updatedAt: '2026-05-04T11:00:00.000Z', confirmationCount: 1 },
      diesel: { price: 57.0, sourceType: 'admin', badge: 'admin-verified', updatedAt: '2026-05-04T11:00:00.000Z', confirmationCount: 1 },
      premium: { price: 69.5, sourceType: 'admin', badge: 'admin-verified', updatedAt: '2026-05-04T11:00:00.000Z', confirmationCount: 1 },
    },
    lastUpdatedAt: '2026-05-04T11:00:00.000Z',
    createdAt: '2026-01-05T00:00:00.000Z',
    updatedAt: '2026-05-04T11:00:00.000Z',
    dataSource: 'scraped',
  },
  {
    id: 'station-006',
    name: 'Unioil Manila',
    brand: 'Unioil',
    address: 'Roxas Blvd',
    barangay: 'Malate',
    city: 'Manila',
    province: 'Metro Manila',
    latitude: 14.5734,
    longitude: 120.9849,
    fuelTypes: ['gasoline', 'diesel'],
    latestPrices: {
      gasoline: { price: 62.0, sourceType: 'scraped', badge: 'baseline', updatedAt: '2026-05-01T06:00:00.000Z', confirmationCount: 0 },
      diesel: { price: 55.0, sourceType: 'scraped', badge: 'baseline', updatedAt: '2026-05-01T06:00:00.000Z', confirmationCount: 0 },
    },
    lastUpdatedAt: '2026-05-01T06:00:00.000Z',
    createdAt: '2026-01-06T00:00:00.000Z',
    updatedAt: '2026-05-01T06:00:00.000Z',
    dataSource: 'scraped',
  },
  {
    id: 'station-007',
    name: 'Petron Cebu South Road',
    brand: 'Petron',
    address: 'South Road Properties',
    barangay: 'Talisay',
    city: 'Cebu City',
    province: 'Cebu',
    latitude: 10.2748,
    longitude: 123.8502,
    fuelTypes: ['gasoline', 'diesel', 'premium'],
    latestPrices: {
      gasoline: { price: 63.5, sourceType: 'scraped', badge: 'baseline', updatedAt: '2026-05-01T08:00:00.000Z', confirmationCount: 0 },
      diesel: { price: 56.5, sourceType: 'scraped', badge: 'baseline', updatedAt: '2026-05-01T08:00:00.000Z', confirmationCount: 0 },
      premium: { price: 68.5, sourceType: 'scraped', badge: 'baseline', updatedAt: '2026-05-01T08:00:00.000Z', confirmationCount: 0 },
    },
    lastUpdatedAt: '2026-05-01T08:00:00.000Z',
    createdAt: '2026-01-07T00:00:00.000Z',
    updatedAt: '2026-05-01T08:00:00.000Z',
    dataSource: 'scraped',
  },
  {
    id: 'station-008',
    name: 'Shell Davao Quirino',
    brand: 'Shell',
    address: 'Quirino Ave, Davao City',
    barangay: 'Poblacion',
    city: 'Davao City',
    province: 'Davao del Sur',
    latitude: 7.0731,
    longitude: 125.6128,
    fuelTypes: ['gasoline', 'diesel'],
    latestPrices: {
      gasoline: { price: 62.8, sourceType: 'scraped', badge: 'baseline', updatedAt: '2026-05-01T08:00:00.000Z', confirmationCount: 0 },
      diesel: { price: 56.0, sourceType: 'scraped', badge: 'baseline', updatedAt: '2026-05-01T08:00:00.000Z', confirmationCount: 0 },
    },
    lastUpdatedAt: '2026-05-01T08:00:00.000Z',
    createdAt: '2026-01-08T00:00:00.000Z',
    updatedAt: '2026-05-01T08:00:00.000Z',
    dataSource: 'scraped',
  },
]

// ---------------------------------------------------------------------------
// Fuel prices (current) — derived from stations
// ---------------------------------------------------------------------------

export const mockFuelPrices: FuelPrice[] = mockStations.flatMap((station) =>
  (Object.entries(station.latestPrices) as [FuelType, NonNullable<Station['latestPrices'][FuelType]>][]).map(
    ([fuelType, sp]) => ({
      id: `${station.id}_${fuelType}`,
      stationId: station.id,
      fuelType,
      currentPrice: sp.price,
      sourceType: sp.sourceType,
      confirmedReportId: null,
      confirmationCount: sp.confirmationCount,
      updatedAt: sp.updatedAt,
    }),
  ),
)

// ---------------------------------------------------------------------------
// Price history
// ---------------------------------------------------------------------------

export const mockPriceHistory: PriceHistory[] = [
  { id: 'hist-001', stationId: 'station-001', fuelType: 'gasoline', oldPrice: 64.0, newPrice: 62.5, sourceType: 'scraped', reportId: null, changedAt: '2026-05-01T08:00:00.000Z' },
  { id: 'hist-002', stationId: 'station-001', fuelType: 'diesel', oldPrice: 57.0, newPrice: 55.8, sourceType: 'scraped', reportId: null, changedAt: '2026-05-01T08:00:00.000Z' },
  { id: 'hist-003', stationId: 'station-003', fuelType: 'gasoline', oldPrice: 63.5, newPrice: 61.9, sourceType: 'community', reportId: 'report-001', changedAt: '2026-05-03T10:00:00.000Z' },
  { id: 'hist-004', stationId: 'station-005', fuelType: 'gasoline', oldPrice: 63.0, newPrice: 64.0, sourceType: 'admin', reportId: null, changedAt: '2026-05-04T11:00:00.000Z' },
]

// ---------------------------------------------------------------------------
// Price reports
// ---------------------------------------------------------------------------

export const mockPriceReports: PriceReport[] = [
  {
    id: 'report-001',
    stationId: 'station-003',
    fuelType: 'gasoline',
    reportedPrice: 61.9,
    normalizedPrice: 61.9,
    baselinePrice: 63.5,
    priceDeltaPercent: -2.52,
    reporterId: 'user-002',
    evidenceUrl: null,
    status: 'confirmed',
    confirmCount: 5,
    rejectCount: 0,
    flagCount: 0,
    validatorThreshold: 4,
    confirmationCount: 5,
    expiresAt: '2026-05-06T10:00:00.000Z',
    confirmedAt: '2026-05-03T10:00:00.000Z',
    createdAt: '2026-05-03T09:00:00.000Z',
    updatedAt: '2026-05-03T10:00:00.000Z',
  },
  {
    id: 'report-002',
    stationId: 'station-001',
    fuelType: 'diesel',
    reportedPrice: 55.5,
    normalizedPrice: 55.5,
    baselinePrice: 55.8,
    priceDeltaPercent: -0.54,
    reporterId: 'user-003',
    evidenceUrl: null,
    status: 'pending',
    confirmCount: 1,
    rejectCount: 0,
    flagCount: 0,
    validatorThreshold: 4,
    expiresAt: '2026-05-11T08:00:00.000Z',
    createdAt: '2026-05-08T08:00:00.000Z',
    updatedAt: '2026-05-08T08:30:00.000Z',
  },
  {
    id: 'report-003',
    stationId: 'station-002',
    fuelType: 'premium',
    reportedPrice: 67.5,
    normalizedPrice: 67.5,
    baselinePrice: 68.0,
    priceDeltaPercent: -0.74,
    reporterId: 'user-002',
    evidenceUrl: null,
    status: 'pending',
    confirmCount: 2,
    rejectCount: 0,
    flagCount: 0,
    validatorThreshold: 4,
    expiresAt: '2026-05-11T09:00:00.000Z',
    createdAt: '2026-05-08T09:00:00.000Z',
    updatedAt: '2026-05-08T09:15:00.000Z',
  },
]

// ---------------------------------------------------------------------------
// Validation votes (keyed by reportId)
// ---------------------------------------------------------------------------

export const mockValidationVotes: Record<string, ValidationVote[]> = {
  'report-001': [
    { id: 'vote-001', reportId: 'report-001', userId: 'user-001', voteType: 'confirm', votedAt: '2026-05-03T09:05:00.000Z' },
    { id: 'vote-002', reportId: 'report-001', userId: 'user-admin', voteType: 'confirm', votedAt: '2026-05-03T09:10:00.000Z' },
    { id: 'vote-003', reportId: 'report-001', userId: 'user-004', voteType: 'confirm', votedAt: '2026-05-03T09:20:00.000Z' },
    { id: 'vote-004', reportId: 'report-001', userId: 'user-005', voteType: 'confirm', votedAt: '2026-05-03T09:30:00.000Z' },
    { id: 'vote-005', reportId: 'report-001', userId: 'user-006', voteType: 'confirm', votedAt: '2026-05-03T09:40:00.000Z' },
  ],
  'report-002': [
    { id: 'vote-006', reportId: 'report-002', userId: 'user-001', voteType: 'confirm', votedAt: '2026-05-08T08:20:00.000Z' },
  ],
  'report-003': [
    { id: 'vote-007', reportId: 'report-003', userId: 'user-001', voteType: 'confirm', votedAt: '2026-05-08T09:05:00.000Z' },
    { id: 'vote-008', reportId: 'report-003', userId: 'user-004', voteType: 'confirm', votedAt: '2026-05-08T09:10:00.000Z' },
  ],
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export const mockUsers: UserProfile[] = [
  { uid: 'user-admin', displayName: 'Admin User', email: 'admin@gaspricewatch.ph', photoURL: null, role: 'admin', trustScore: 100, reportCount: 10, confirmedReportCount: 8, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-05-01T00:00:00.000Z' },
  { uid: 'user-001', displayName: 'Juan dela Cruz', email: 'juan@example.com', photoURL: null, role: 'moderator', trustScore: 45, reportCount: 9, confirmedReportCount: 7, createdAt: '2026-01-10T00:00:00.000Z', updatedAt: '2026-05-03T00:00:00.000Z' },
  { uid: 'user-002', displayName: 'Maria Santos', email: 'maria@example.com', photoURL: null, role: 'user', trustScore: 30, reportCount: 6, confirmedReportCount: 5, createdAt: '2026-02-01T00:00:00.000Z', updatedAt: '2026-05-03T00:00:00.000Z' },
  { uid: 'user-003', displayName: 'Pedro Reyes', email: 'pedro@example.com', photoURL: null, role: 'user', trustScore: 10, reportCount: 2, confirmedReportCount: 1, createdAt: '2026-03-01T00:00:00.000Z', updatedAt: '2026-05-08T00:00:00.000Z' },
  { uid: 'user-004', displayName: 'Ana Garcia', email: 'ana@example.com', photoURL: null, role: 'user', trustScore: 20, reportCount: 4, confirmedReportCount: 3, createdAt: '2026-02-15T00:00:00.000Z', updatedAt: '2026-05-08T00:00:00.000Z' },
  { uid: 'user-005', displayName: 'Carlos Mendoza', email: 'carlos@example.com', photoURL: null, role: 'user', trustScore: 15, reportCount: 3, confirmedReportCount: 2, createdAt: '2026-03-10T00:00:00.000Z', updatedAt: '2026-05-03T00:00:00.000Z' },
  { uid: 'user-006', displayName: 'Rosa Villanueva', email: 'rosa@example.com', photoURL: null, role: 'user', trustScore: 5, reportCount: 1, confirmedReportCount: 1, createdAt: '2026-04-01T00:00:00.000Z', updatedAt: '2026-05-03T00:00:00.000Z' },
]

// ---------------------------------------------------------------------------
// Station submissions
// ---------------------------------------------------------------------------

export const mockStationSubmissions: StationSubmissionListItem[] = [
  {
    id: 'submission-001',
    name: 'New Petron Station',
    brand: 'Petron',
    address: 'Katipunan Ave',
    city: 'Quezon City',
    province: 'Metro Manila',
    latitude: 14.6523,
    longitude: 121.0705,
    fuelTypes: ['gasoline', 'diesel'],
    status: 'pending',
    legitCount: 12,
    notLegitCount: 1,
    legitThreshold: 46,
    rejectThreshold: 6,
    submittedBy: 'user-002',
    submittedByName: 'Maria Santos',
    submittedByEmail: 'maria@example.com',
    createdAt: '2026-05-05T08:00:00.000Z',
    updatedAt: '2026-05-07T10:00:00.000Z',
    approvedAt: null,
    approvedBy: null,
    rejectedAt: null,
    rejectedBy: null,
    promotedStationId: null,
  },
  {
    id: 'submission-002',
    name: 'Indie Gas Station Mandaluyong',
    brand: null,
    address: 'Shaw Blvd',
    city: 'Mandaluyong',
    province: 'Metro Manila',
    latitude: 14.5849,
    longitude: 121.0351,
    fuelTypes: ['gasoline', 'diesel', 'kerosene'],
    status: 'rejected',
    legitCount: 3,
    notLegitCount: 7,
    legitThreshold: 46,
    rejectThreshold: 6,
    submittedBy: 'user-003',
    submittedByName: 'Pedro Reyes',
    submittedByEmail: 'pedro@example.com',
    createdAt: '2026-04-20T08:00:00.000Z',
    updatedAt: '2026-04-25T10:00:00.000Z',
    approvedAt: null,
    approvedBy: null,
    rejectedAt: '2026-04-25T10:00:00.000Z',
    rejectedBy: 'community',
    promotedStationId: null,
  },
]

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export const mockStats = {
  stationCount: mockStations.length,
  reportCount: mockPriceReports.length,
  userCount: mockUsers.length,
  averagePrices: [
    { fuelType: 'diesel', avgPrice: 55.87 },
    { fuelType: 'gasoline', avgPrice: 62.79 },
    { fuelType: 'kerosene', avgPrice: 48.5 },
    { fuelType: 'lpg', avgPrice: 850.0 },
    { fuelType: 'premium', avgPrice: 68.33 },
  ],
}

// ---------------------------------------------------------------------------
// Price snapshots (baseline — read-only, from scraper)
// ---------------------------------------------------------------------------

export const mockPriceSnapshots: PriceSnapshot[] = [
  { id: 'snap-001', sourceName: 'DOE Luzon', sourceUrl: null, brand: 'Petron', fuelType: 'gasoline', locationScope: 'Luzon', price: 62.5, scrapedAt: '2026-05-01T00:00:00.000Z' },
  { id: 'snap-002', sourceName: 'DOE Luzon', sourceUrl: null, brand: 'Shell', fuelType: 'diesel', locationScope: 'Luzon', price: 56.2, scrapedAt: '2026-05-01T00:00:00.000Z' },
]

// ---------------------------------------------------------------------------
// Helper: derive StationListItem from Station
// ---------------------------------------------------------------------------

export function stationToListItem(station: Station): StationListItem {
  const entries = Object.entries(station.latestPrices ?? {}) as [FuelType, { price: number } | undefined][]
  const lowestEntry = entries.reduce<[FuelType, number] | null>((acc, [ft, sp]) => {
    if (!sp?.price) return acc
    if (!acc || sp.price < acc[1]) return [ft, sp.price]
    return acc
  }, null)

  return {
    id: station.id,
    name: station.name,
    brand: station.brand ?? null,
    city: station.city,
    province: station.province,
    latitude: station.latitude,
    longitude: station.longitude,
    lowestPrice: lowestEntry?.[1] ?? null,
    lowestFuelType: lowestEntry?.[0] ?? null,
  }
}
