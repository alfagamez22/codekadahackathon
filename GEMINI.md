# Project Overview: CodeKada GasTrackPH

**GasTrackPH** is a Philippine fuel-price tracking web application focused on Metro Manila and CALABARZON. It provides station-level prices initialized from public data (GasWatchPH) and refined through authenticated community reports using a multi-user validation handshake.

## Main Technologies
- **Framework:** Next.js 16+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Database:** Firebase Firestore
- **Authentication:** Firebase Auth (Google OAuth)
- **Maps:** Leaflet & Leaflet.markercluster
- **Routing:** Geoapify
- **State Management:** TanStack Query
- **Data Fetching:** Server Actions & Route Handlers

## Core Architecture & Concepts

### 1. Data Ingestion & Scraping
- Initial data is scraped from GasWatchPH.
- Scraping logic is primarily in `functions/` (Firebase Cloud Functions) and scripts like `scripts/sync-network-stations.mjs`.

### 2. Community Consensus Engine
- Users submit observed pump prices.
- A submitted price remains "pending" until it passes a **4-user validation handshake**.
- Clustered reports (closeness within ~₱0.50) are used to compute a statistically reliable consensus price.

### 3. Route & Efficiency Calculation
- Calculates detour cost: "Is it worth driving to a cheaper station?"
- Formula: `Net Savings = (Price Diff * Fill Volume) - (Detour Distance * Fuel Cost)`.
- Uses Geoapify for distance/duration.

### 4. Vehicle Profiles
- Users can save vehicle profiles with engine displacement presets.
- Displacement-based fuel efficiency (km/L) estimates are provided but user-overridable.

## Project Structure

- `app/`: Next.js App Router pages.
  - `(app)/`: Protected application routes (dashboard, stations, route-planner).
  - `(auth)/`: Authentication routes (login, register).
  - `api/`: API Route Handlers.
  - `_actions/`: Next.js Server Actions for form submissions and data mutations.
- `components/`: UI components organized by feature (admin, auth, reports, route, stations, ui).
- `lib/`: Shared logic and service clients.
  - `firebase/`: Firestore refs, client config, and auth helpers.
  - `auth/`: Session guards and superadmin logic.
  - `utils/`: Common formatting and calculation utilities.
- `functions/`: Firebase Cloud Functions source (TypeScript).
- `hooks/`: Custom React hooks (geolocation, stations, auth, etc.).
- `types/`: Domain-specific TypeScript interfaces.
- `scripts/`: Maintenance and data sync scripts.

## Building and Running

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Firebase Setup & Seeding
```bash
# Deploy firestore rules/indexes and seed initial data
npm run firebase:bootstrap

# Run specific sync scripts
npm run firebase:sync-network
npm run firebase:sync-sql
```

## Development Conventions

### Coding Style
- **TypeScript:** Strict typing is required. Avoid `any`.
- **Components:** Functional components with Tailwind CSS.
- **Server Actions:** Prefer Server Actions in `app/_actions/` for data mutations over API routes where possible.
- **State:** Use TanStack Query for client-side data fetching and caching.

### Database Patterns
- All Firestore references should be defined in `lib/firebase/firestore.ts`.
- Use `zod` for schema validation (see `app/_actions/validations.ts`).

### Testing
- Currently no automated testing framework is explicitly configured, but logic-heavy modules (consensus engine, cost calculator) should be prioritized for unit tests in the future.

## Key Files
- `docs/codekada_gastrackph_full_plan.md`: Comprehensive system implementation plan.
- `lib/firebase/firestore.ts`: Centralized Firestore access.
- `app/_actions/stations.ts`: Station data mutations.
- `app/_actions/validations.ts`: Data validation schemas.
- `hooks/use-stations.ts`: Primary hook for fetching and filtering stations.
