'use server'
import 'server-only'

// Legacy flat query file — delegates to the modular query layer which uses mock data.
// Do not add new Firestore calls here.

export {
  getStation,
  searchStations,
  getNearbyStations,
  createStation,
  updateStation,
  deleteStation,
} from './queries/stations'

export {
  getCurrentPrices,
  getPriceHistory,
  upsertConfirmedPrice,
  getBaselinePrices,
} from './queries/prices'

export {
  getUser,
  upsertUser,
  updateUserRole,
  listUsers,
  incrementUserReportCount,
} from './queries/users'

export { getSystemStats, getTopContributors } from './queries/analytics'
