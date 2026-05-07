# GasTOS — Full Technical Documentation

**Live site:** [https://codekada-seven.vercel.app](https://codekada-seven.vercel.app)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Architecture Overview](#3-architecture-overview)
4. [Folder Structure](#4-folder-structure)
5. [Pages & Routes](#5-pages--routes)
6. [Key Features](#6-key-features)
7. [Data Layer — Firestore](#7-data-layer--firestore)
8. [Server Actions](#8-server-actions)
9. [API Route Handlers](#9-api-route-handlers)
10. [Auth & Roles](#10-auth--roles)
11. [Firebase Cloud Functions](#11-firebase-cloud-functions)
12. [Type Definitions](#12-type-definitions)
13. [Custom Hooks](#13-custom-hooks)
14. [Feature Slices](#14-feature-slices)
15. [Business Rules & Validation Logic](#15-business-rules--validation-logic)
16. [Firestore Security Rules](#16-firestore-security-rules)
17. [External Services](#17-external-services)

---

## 1. Project Overview

**GasTOS** is a community-powered fuel price tracking platform for the Philippines, focused on Metro Manila and CALABARZON. It solves a simple problem: before you drive to a gas station, you don't know what the pump price is.

The app combines:

- **Live price data** — fetches and parses the GasWatchPH live feed (gaswatchph.com) for national and brand-level price averages
- **Crowdsourced price reports** — users submit pump prices they observe; three independent confirmations are required before a price goes live
- **Station discovery** — interactive map with GPS-aware nearby station search, ranked by total trip cost (not just pump price)
- **Route planner** — finds fuel stations along a route and calculates whether a detour is actually worth the extra fuel and time
- **AI recommendations** — GPT-4o-mini suggests the best station given your location, vehicle, and nearby prices
- **Role-based moderation** — users, moderators, admins, and superadmins each have separate dashboards and permissions

---

## 2. Tech Stack

| Concern | Technology | Version |
|---|---|---|
| Framework | Next.js, App Router | 16.2.4 |
| UI | React | 19.2.4 |
| Language | TypeScript (strict mode) | 5 |
| Styling | Tailwind CSS v4 via PostCSS | v4 |
| Validation | Zod | 4.4.2 |
| Client data | TanStack Query | 5.100.9 |
| Auth | Firebase Auth (Google OAuth) + session cookies | 12.12.1 |
| Database | Firestore (Firestore-only — no SQL) | 12.12.1 |
| Admin SDK | Firebase Admin | 12.0.0 |
| Cloud Functions | Firebase Functions v5, Node 20 | v5 |
| Mapping | Leaflet + leaflet.markercluster | 1.9.4 / 1.5.3 |
| Routing / Geocoding | Geoapify API | — |
| Charts | Recharts | 3.8.1 |
| AI | OpenAI GPT-4o-mini | — |
| UI components | Base UI + Shadcn | — |
| Icons | Lucide React + Remixicon | — |

---

## 3. Architecture Overview

### Data flow

```
Browser (React 19)
  ├── Server Components (default)         → fetch from Firestore via firebase-admin
  ├── Client Components ('use client')    → TanStack Query → fetch() → API Routes
  ├── Server Actions ('use server')       → validate (Zod) → guard (requireAuth/requireRole) → Firestore write
  └── Real-time subscriptions             → Firebase client SDK onSnapshot (votes, pending reports)

Firebase Admin SDK (server-only)
  └── lib/firebase-admin/queries.ts       ← single source of truth for all server-side Firestore CRUD

Firebase Cloud Functions (background)
  ├── Scheduled: scrape prices every 6h  → priceSnapshots collection
  └── Triggers: onReportValidated        → promote confirmed reports to fuelPrices
               onUserCreated             → initialize user profile
```

### Auth flow

1. User signs in with Google on the client via Firebase Auth
2. Client sends the Firebase ID token to `POST /api/auth/session`
3. Server verifies the token with Firebase Admin, creates a session cookie
4. All subsequent requests read the session cookie via `lib/auth/session.ts`
5. Server Actions and protected layouts call `requireAuth()` / `requireRole()` at the top

### Mutation pattern (Server Actions)

Every write in the app goes through a Server Action. The pattern is strict:

```ts
'use server'

export async function exampleAction(input: unknown) {
  const session = await requireAuth()         // redirect if unauthenticated
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { error: 'Validation failed' }

  // write to Firestore via lib/firebase-admin/queries.ts

  return { success: true }
}
```

Actions never throw to the caller — they always return `{ success }` or `{ error }`.

---

## 4. Folder Structure

```
codekadahackathon/
├── app/
│   ├── _actions/               # All Server Actions ('use server')
│   ├── (marketing)/            # Public landing page
│   ├── (auth)/                 # Login / register
│   ├── (app)/                  # Authenticated user routes
│   │   ├── dashboard/
│   │   ├── stations/
│   │   │   ├── nearby/         # GPS-aware map + Smart Station Optimizer
│   │   │   └── [id]/           # Station detail, price history, report form
│   │   ├── route-planner/      # Route-based fuel stop finder
│   │   ├── validate/           # Community price validation queue
│   │   ├── profile/[uid]/
│   │   └── settings/
│   ├── (protected-admin)/      # Admin-only routes
│   │   └── admin/              # Station CRUD, user management, system config
│   ├── (protected-moderator)/  # Moderator-only routes
│   ├── superadmin/             # Superadmin controls
│   ├── logout/                 # Logout handler
│   └── api/                    # REST Route Handlers
│       ├── auth/               # Session cookie management
│       ├── ai/station-recommendation/
│       ├── admin/
│       ├── community-prices/
│       ├── community-overrides/
│       ├── gaswatchph/         # GasWatchPH feed proxy
│       ├── notifications/      # FCM push notifications
│       ├── osm-stations/       # OpenStreetMap import
│       ├── prices/
│       ├── reports/
│       ├── station-submissions/
│       ├── stations/
│       └── webhooks/
│
├── components/
│   ├── ui/                     # Primitives: button, card, badge, input, skeleton
│   ├── auth/                   # Google sign-in button, auth forms
│   ├── layout/                 # Nav, sidebar, header
│   ├── dashboard/              # Stats cards, PriceAutoRefresher, leaderboard
│   ├── stations/               # StationMap, FuelPriceTable, PriceHistoryChart, SubmissionPanel
│   ├── validate/               # PendingReportCard, validation voting UI
│   ├── reports/                # ReportForm for price submission
│   ├── route/                  # RoutePlanner, RouteMap, FuelCostCalculator
│   ├── admin/                  # UserManagementTable, StationEditor, SystemConfigForm
│   ├── moderator/              # Moderator queue UI
│   ├── pwa/                    # InstallPrompt, OfflineIndicator
│   └── providers/              # RootProviders (TanStack Query + auth context)
│
├── hooks/
│   ├── use-auth.ts
│   ├── use-geolocation.ts
│   ├── use-user-location.ts
│   ├── use-stations.ts
│   ├── use-route-calculation.ts
│   ├── use-route-calculation-dev.ts
│   ├── use-validation-votes.ts
│   ├── use-push-notifications.ts
│   └── use-pwa-install.ts
│
├── lib/
│   ├── auth/
│   │   ├── guards.ts           # requireAuth(), requireRole(), requireSuperadmin()
│   │   ├── session.ts          # Session cookie read/write
│   │   └── superadmin.ts
│   ├── firebase/               # Client-side Firebase SDK
│   │   ├── client.ts           # Firebase app init
│   │   ├── auth.ts             # Google OAuth sign-in/sign-out
│   │   ├── firestore.ts        # Real-time onSnapshot subscriptions
│   │   └── messaging.ts        # FCM token registration
│   ├── firebase-admin/         # Server-side Firebase Admin SDK
│   │   ├── queries.ts          # Re-exports all server-side Firestore CRUD
│   │   ├── queries/
│   │   │   ├── stations.ts
│   │   │   ├── prices.ts
│   │   │   ├── users.ts
│   │   │   ├── analytics.ts
│   │   │   └── station-submissions.ts
│   │   ├── firestore.ts        # adminDb singleton + getSystemConfig()
│   │   └── auth.ts             # verifyIdToken, setUserRole, createSessionCookie
│   ├── utils/
│   │   ├── format.ts           # Currency (PHP), date, distance formatting
│   │   ├── geo.ts              # Haversine distance, coordinate utilities
│   │   └── validators.ts       # Shared Zod schemas
│   ├── gaswatchph.ts           # GasWatchPH price feed client (server-only)
│   └── crowdsourced-stations.ts
│
├── src/features/
│   ├── gas-prices/             # Community gas prices feature slice
│   └── osm-stations/           # OpenStreetMap station import feature slice
│
├── types/                      # Shared TypeScript types
│   ├── auth.ts
│   ├── station.ts
│   ├── price.ts
│   ├── report.ts
│   ├── route.ts
│   ├── station-submission.ts
│   ├── notification.ts
│   ├── scraper.ts
│   └── api.ts
│
├── functions/                  # Firebase Cloud Functions (separate npm workspace)
│   └── src/
│       ├── index.ts            # Exports all functions
│       ├── scheduled/
│       │   └── scrape-prices.ts
│       ├── triggers/
│       │   ├── on-report-validated.ts
│       │   └── on-user-created.ts
│       └── utils/
│           └── notify.ts
│
└── scripts/
    ├── seed-firestore.mjs
    └── sync-network-stations.mjs
```

---

## 5. Pages & Routes

### Public

| Route | Component | Description |
|---|---|---|
| `/` | `(marketing)/page.tsx` | Landing page — hero, stats, feature cards, Google sign-in CTA |
| `/login` | `(auth)/login/` | Firebase Google OAuth login |
| `/register` | `(auth)/register/` | Registration |

### Authenticated (`(app)/`)

| Route | Description |
|---|---|
| `/dashboard` | Stats overview, live GasWatchPH national price feed, top contributors leaderboard. Admin users get extra tabs: Users, Stations, Config |
| `/stations/nearby` | GPS-aware interactive map + **Smart Station Optimizer** (ranks stations by total trip cost) |
| `/stations/[id]` | Station detail — brand, address, fuel types, current prices table |
| `/stations/[id]/history` | Per-station price change history table |
| `/stations/[id]/report` | Submit a community price report for a station |
| `/route-planner` | Find fuel stations along a route; calculates detour cost vs. savings |
| `/validate` | Real-time community validation queue — confirm/reject/flag pending price reports |
| `/profile/[uid]` | User contribution history |
| `/settings` | User settings |

### Admin (`(protected-admin)/`)

Accessible by `admin` and `superadmin` roles only.

| Route | Description |
|---|---|
| `/admin` | Admin overview |
| `/admin/stations` | Station CRUD — create, edit, delete stations; approve/reject station submissions |
| `/admin/users` | User management — view all users, assign roles |
| `/admin/config` | System config — set `minConfirmations`, `reportCooldownHours`, `stalePriceDays`, `priceTolerancePercent`, `reportExpiryHours`, `flagThreshold` |

### Moderator (`(protected-moderator)/`)

Accessible by `moderator`, `admin`, and `superadmin` roles.

| Route | Description |
|---|---|
| `/moderator` | Moderation panel — review flagged reports, manage submitted prices |

### Superadmin

| Route | Description |
|---|---|
| `/superadmin` | Superadmin-only controls |

---

## 6. Key Features

### 6.1 Smart Station Optimizer

Located in `app/(app)/stations/nearby/` — the core user-facing feature. The optimizer answers: *"Which station should I go to, accounting for price, distance, and my time?"*

**Data sources:**
- `/api/gaswatchph/stations` — live GasWatchPH station list with prices
- `/api/stations/nearby?lat&lng&radius&limit` — Firestore-backed station records
- `/api/station-submissions?status=pending` — pending community station submissions
- Geoapify Routing API — per-station ETA calculation for stations within 5 km

**Travel modes:**
- `ROUNDABOUT` — go to station and return to origin
- `ONE_WAY` — station is on the way to a destination
- `TURNOVER` — round trip through a destination; can insert the station stop as `AUTO`, `OUTBOUND_STOP`, or `INBOUND_STOP`

**Station decision model (`StationDecision`):**

| Field | Description |
|---|---|
| `distanceKm` | Haversine distance from current location |
| `etaMinutes` | From Geoapify, or estimated at 30 km/h |
| `stationPrice` | Price for the selected fuel type |
| `travelFuelCost` | Extra distance × (L/km) × reference price |
| `timeCost` | Extra time × PHP/minute time value |
| `objectiveCost` | `gasCost + travelFuelCost + timeCost` |
| `netSavings` | `grossSavings - travelFuelCost - timeCost` |
| `feasible` | Whether current fuel is sufficient to reach the station |
| `infeasibleReason` | Human-readable explanation when `feasible = false` |

**Settings panel inputs:**
- Target fill volume (liters)
- Fuel consumption (km/L, L/100km, or L/km)
- Time value (PHP/min)
- Current fuel level, reserve level, tank capacity
- Fuel type selector

**Vehicle profile:** Persisted to `localStorage`. Presets include Toyota, Honda, Mitsubishi, Nissan, Hyundai models with brand/model/year/displacement/transmission/fuelType.

**Map (`<StationMap />`):**
- User location marker with heading
- Recommended/selected station highlight
- Active route polyline and alternate route polyline
- Draft station point for new submissions
- Pending community station submission markers

**Station submission flow:** User clicks "Add station" → clicks on map → `<StationSubmissionPanel />` form → `submitStationSubmissionAction()`. Submitted stations go through community voting (46 legit votes to auto-promote, 6 not-legit votes to auto-reject) or can be admin-approved/rejected.

---

### 6.2 Community Validation System

The crowdsourced price pipeline:

```
User submits report (submitPriceReportAction)
  → cooldown check: no duplicate (stationId + fuelType) within reportCooldownHours
  → tolerance check: if a fresh price exists, delta must be within priceTolerancePercent
  → creates priceReports doc (status: 'pending', confirmCount: 0)
  → other users see it in /validate (real-time via onSnapshot)

Other users vote (castVoteAction)
  → self-voting blocked
  → double-voting blocked (per-user vote doc in subcollection)
  → confirm: confirmCount++; if >= minConfirmations → status = 'confirmed'
  → reject:  rejectCount++;  if >= minConfirmations → status = 'rejected'
  → flag:    flagCount++;    if >= flagThreshold    → status = 'flagged'

On confirmation:
  → upsertConfirmedPrice() writes fuelPrices/{stationId_fuelType}
  → appends priceHistory entry
  → updates stations.latestPrices.{fuelType}
  → reporter's confirmedReportCount++ and trustScore += 5
```

All `systemConfig` thresholds (`minConfirmations`, `reportCooldownHours`, `stalePriceDays`, `priceTolerancePercent`, `reportExpiryHours`, `flagThreshold`) are runtime-editable by admins at `/admin/config`.

---

### 6.3 Route Planner

`/route-planner` renders the `<RoutePlanner />` component (993 lines). Full flow:

1. **Address inputs** with Geoapify autocomplete (debounced, Philippines-filtered)
2. **Recommended destinations** — Geoapify Places API fetches nearby POIs (malls, restaurants, entertainment, attractions within 10 km), paginated
3. **Calculate Route** → geocodes both addresses → Geoapify routing → `RouteInfo` (distance km, duration min, polyline coordinates)
4. **Nearby stations** — `getNearbyStations()` finds GasWatchPH stations within 2 km corridor of route, ranked by `objectiveCost`
5. **Station selection** → checks if station is within 500m of route polyline (`isStationAlongRoute`); if not, fetches an alternate route via Geoapify with the station as a waypoint
6. **Station decision card** — shows: price, ETA, extra distance detour, fuel cost, time cost, total cost, savings vs average, net savings
7. **Price callout** — submit a community price for any GasWatchPH station directly from the route planner (`submitExternalPriceReportAction`)
8. **AI Chat** — sends context (location, vehicle, nearby stations with prices/ETAs) to `/api/ai/station-recommendation`
9. **Route map** (`<RouteMap />`) — main route polyline, alternate route polyline, user location, start/end markers, station markers with pricing

---

### 6.4 GasWatchPH Live Feed

`lib/gaswatchph.ts` (`server-only`) fetches and parses the live GasWatchPH data file.

**Data URL:** `https://gaswatchph.com/js/data.js?v=20260505a` (overridable via `GASWATCHPH_DATA_URL` env var)

**Exported functions:**

```ts
parseGaswatchStations(source: string): GaswatchStation[]
// Extracts the GAS_STATIONS JS array, JSON.parse()s it
// Returns: [{ id, brand, name, area, lat, lng, prices: Record<fuelType, number|null> }]

parsePriceHistory(source: string): GaswatchPriceWeek[]
// Extracts PRICE_HISTORY array
// Returns: [{ week: "YYYY-MM-DD", label, dieselAvg, unleadedAvg, brands: { [brand]: { diesel, unleaded } } }]

parseGaswatchBrands(source: string): Record<string, GaswatchBrandMeta>
// Extracts BRANDS object: { name, short, color, textColor? }

findCurrentWeekPrices(history, todayPhDate): GaswatchPriceWeek | null
// Returns most recent week entry where week <= todayPhDate (Philippines timezone)

normalizeJsToJson(raw: string): string
// Strips // comments, normalizes single quotes to double quotes,
// quotes unquoted identifier keys, removes trailing commas
```

Brands covered: Shell, Petron, Caltex, Phoenix, Seaoil, Unioil, Jetti, Flying V, Cleanfuel, TotalEnergies, PTT.

---

### 6.5 AI Station Recommendation

`POST /api/ai/station-recommendation`

Powered by OpenAI GPT-4o-mini. Accepts a conversation history plus a context object:

```ts
{
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  context: {
    location: string
    vehicle: VehicleProfile | null
    stations: Array<{
      id, name, brand, area?, distanceKm?, etaMinutes,
      prices: Record<string, number | null>
    }>
  }
}
```

The system prompt instructs the model to balance price, ETA, and vehicle fuel type when ranking stations. Returns `{ reply: string }`. Temperature is `0.3` for consistent, factual responses.

---

### 6.6 PWA

- Service worker at `/sw.js` with `Cache-Control: no-cache` headers set in `next.config.ts`
- Web manifest at `app/manifest.ts`
- `<InstallPrompt />` captures the `beforeinstallprompt` event and surfaces an install banner
- `<OfflineIndicator />` ribbon shown when the browser is offline
- Apple PWA meta tags in the root layout
- FCM push notifications via `use-push-notifications.ts` (stores device tokens in `pushSubscriptions/{uid}`)

---

## 7. Data Layer — Firestore

All server-side reads and writes go through `lib/firebase-admin/queries.ts`. **Do not import from `lib/db/` (dead Postgres/Prisma code) or `lib/firebase-admin/sql-mirror.ts` (dead).**

### Collections

| Collection | Doc ID Format | Key Fields |
|---|---|---|
| `users` | `{uid}` | uid, role, trustScore, reportCount, confirmedReportCount, createdAt |
| `stations` | UUID / `gaswatch-{id}` / `community-{submissionId}` | name, brand, city, province, lat, lng, fuelTypes, latestPrices, dataSource |
| `fuelPrices` | `{stationId}_{fuelType}` | currentPrice, sourceType, badge, confirmationCount, updatedAt |
| `priceHistory` | UUID | stationId, fuelType, oldPrice, newPrice, sourceType, reportId, changedAt |
| `priceReports` | auto-ID | stationId, fuelType, reportedPrice, status, confirmCount, rejectCount, flagCount, expiresAt |
| `priceReports/{id}/votes` | `{userId}` | userId, voteType, votedAt |
| `stationSubmissions` | auto-ID | name, lat, lng, legitCount, notLegitCount, status, promotedStationId |
| `stationSubmissions/{id}/votes` | `{userId}` | userId, voteType, votedAt |
| `priceSnapshots` | UUID | sourceName, brand, fuelType, locationScope, price, scrapedAt |
| `systemConfig` | (single doc) | minConfirmations, reportCooldownHours, stalePriceDays, priceTolerancePercent, reportExpiryHours, flagThreshold |
| `stats/global` | `global` | stationCount, reportCount, userCount, priceSums |
| `auditLogs` | auto-ID | adminId, action, targetType, targetId, before?, after, createdAt |
| `pushSubscriptions` | `{uid}` | userId, token, updatedAt |

### Query functions

#### Stations (`queries/stations.ts`)

```ts
getStation(id: string): Promise<Station | null>

searchStations(params: {
  province?, city?, brand?, fuelType?: FuelType, search?, page?, pageSize?
}): Promise<{ stations: StationListItem[]; total: number }>

getNearbyStations(params: {
  lat, lng, radiusKm?, fuelType?, limit?
}): Promise<StationListItem[]>
// Full scan + Haversine filter + sort by distance

createStation(data: {
  name, brand?, address?, barangay?, city, province, latitude, longitude, fuelTypes
}): Promise<string>

updateStation(id: string, data: Partial<Station>): Promise<void>

deleteStation(id: string): Promise<void>
// Batch deletes station + fuelPrices + priceHistory docs
```

#### Prices (`queries/prices.ts`)

```ts
getCurrentPrices(stationId: string): Promise<FuelPrice[]>

getPriceHistory(params: {
  stationId, fuelType?, from?, to?, limit?
}): Promise<PriceHistory[]>

upsertConfirmedPrice(data: {
  stationId, fuelType, price, sourceType, confirmedReportId?, confirmationCount?
}): Promise<void>
// Atomic: sets fuelPrices/{stationId_fuelType}, appends priceHistory,
// updates stations.latestPrices.{fuelType}
// Badge: 'admin' → 'admin-verified', 'community' → 'community-verified', else 'baseline'

getBaselinePrices(params: { fuelType?, brand?, limit? }): Promise<PriceSnapshot[]>
```

#### Users (`queries/users.ts`)

```ts
getUser(id: string): Promise<UserProfile | null>

upsertUser(data: { id, displayName?, email?, photoURL?, role? }): Promise<void>
// New doc defaults: role='user', trustScore=0, reportCount=0, confirmedReportCount=0
// Increments stats/global userCount on first create

updateUserRole(id: string, role: UserRole): Promise<void>

incrementUserReportCount(id: string, confirmed?: boolean): Promise<void>
// confirmed=true also increments confirmedReportCount and trustScore by +5

listUsers(params: { page?, pageSize?, role? }): Promise<{ users: UserProfile[]; total: number }>

getTopContributors(limit?: number): Promise<Array<{
  uid, displayName, confirmedReportCount, trustScore
}>>
// Orders by confirmedReportCount desc, then trustScore desc
```

#### Analytics (`queries/analytics.ts`)

```ts
getSystemStats(): Promise<GlobalStats>
// Reads stats/global. averagePrices computed from priceSums.{fuelType}.{sum, count}

incrementReportCount(): Promise<void>
incrementUserCount(): Promise<void>
incrementStationCount(): Promise<void>

updatePriceAverage(fuelType: FuelType, newPrice: number, oldPrice?: number): Promise<void>
// Maintains running sum/count for average price calculation
```

#### Station Submissions (`queries/station-submissions.ts`)

```ts
listStationSubmissions(params: { status?, limit? }): Promise<StationSubmissionListItem[]>

createStationSubmission(input: StationSubmissionInput, session: SessionUser): Promise<string>

voteStationSubmission(
  input: { submissionId, voteType: 'legit' | 'not_legit' },
  session: SessionUser
): Promise<{ promotedStationId?: string }>
// Firestore transaction: records vote, increments count
// legitCount >= 46 → promotes to stations as 'community-{submissionId}'
// notLegitCount >= 6 → status = 'rejected'

approveStationSubmission(submissionId: string, session: SessionUser): Promise<{ promotedStationId: string }>
rejectStationSubmission(submissionId: string, session: SessionUser): Promise<void>
```

---

## 8. Server Actions

All actions in `app/_actions/`. Every action:
- Has `'use server'` at the top of the file
- Calls `requireAuth()` or `requireRole([...])` first
- Validates input with Zod `.safeParse()`
- Returns `{ success, ...data }` or `{ error: string }` — never throws

### `auth.ts`

```ts
signOutAction(): Promise<never>
// Revokes Firebase refresh tokens, clears session cookie, redirects to /login
```

### `reports.ts`

```ts
submitPriceReportAction(input: PriceReportInput): Promise<{ success, reportId } | { error }>
// Validates: priceReportSchema (stationId, fuelType, reportedPrice, evidenceUrl?)
// Checks cooldown: blocks duplicate (stationId + fuelType) within reportCooldownHours
// Checks tolerance: blocks if |delta| > priceTolerancePercent vs. existing fresh price
// Creates priceReports doc, increments user reportCount and global reportCount

submitExternalPriceReportAction(input: ExternalPriceReportInput): Promise<{ success, reportId } | { error }>
// Same as above, but for GasWatchPH stations not yet in Firestore
// First upserts station with dataSource: 'community-gaswatchph', id: 'gaswatch-{externalId}'

flagReportAction(reportId: string): Promise<{ success }>
// Sets report status to 'flagged'
```

### `validations.ts`

```ts
castVoteAction(input: { reportId, voteType: 'confirm' | 'reject' | 'flag' }): Promise<{ success } | { error }>
// Firestore transaction:
//   - Report must exist and be 'pending'
//   - Report must not be expired (expiresAt)
//   - Self-voting blocked (reporterId === userId)
//   - Double-voting blocked (votes/{userId} subcollection check)
//   - Records vote, increments appropriate count
//   - confirm >= minConfirmations → confirmed → upsertConfirmedPrice(), reporter trustScore += 5
//   - reject  >= minConfirmations → rejected
//   - flag    >= flagThreshold   → flagged
```

### `stations.ts`

```ts
createStationAction(input: StationInput): Promise<{ success, stationId } | { error }>
// requireRole(['admin'])

updateStationAction(id: string, input: Partial<StationInput>): Promise<{ success } | { error }>
// requireRole(['admin'])

deleteStationAction(id: string): Promise<{ success }>
// requireRole(['admin'])

adminOverridePriceAction(data: { stationId, fuelType, price }): Promise<{ success }>
// requireRole(['admin'])
// Calls upsertConfirmedPrice({ sourceType: 'admin' }) → badge: 'admin-verified'
// Logs audit entry
```

### `users.ts`

```ts
updateProfileAction(data: { displayName?, photoURL? }): Promise<{ success }>
// requireAuth()

assignRoleAction(targetUserId: string, role: UserRole): Promise<{ success }>
// requireRole(['admin'])
// Updates Firestore users doc + Firebase Auth custom claims
// Logs audit entry
```

### `notifications.ts`

```ts
subscribeToPushAction(token: string): Promise<{ success }>
// requireAuth() — writes to pushSubscriptions/{uid}

unsubscribeFromPushAction(): Promise<{ success }>
// Deletes pushSubscriptions/{uid}
```

### `station-submissions.ts`

```ts
submitStationSubmissionAction(input: StationSubmissionInput): Promise<{ success, submissionId } | { error }>
// requireAuth()

voteStationSubmissionAction(input: StationSubmissionVoteInput): Promise<{ success, promotedStationId? } | { error }>
// requireAuth()

adminApproveStationSubmissionAction(submissionId: string): Promise<{ success, promotedStationId } | { error }>
// requireRole(['admin']) — immediately promotes to stations collection, logs audit

adminRejectStationSubmissionAction(submissionId: string): Promise<{ success } | { error }>
// requireRole(['admin']) — sets status 'rejected', logs audit
```

---

## 9. API Route Handlers

| Route | Method | Description |
|---|---|---|
| `/api/auth/session` | POST | Verify Firebase ID token, create session cookie |
| `/api/auth/session` | DELETE | Clear session cookie |
| `/api/stations` | GET | List/search stations |
| `/api/stations/nearby` | GET | Stations within radius (`?lat&lng&radius&limit`) |
| `/api/stations/[id]` | GET/PUT/DELETE | Station CRUD |
| `/api/prices` | GET | Fuel prices |
| `/api/reports` | POST | Submit a price report |
| `/api/community-prices` | GET | Community-validated prices map |
| `/api/community-overrides` | GET | Community price overrides for route planner |
| `/api/gaswatchph` | GET | Proxy: fetch + parse GasWatchPH JS data |
| `/api/gaswatchph/stations` | GET | Parsed GasWatchPH station list with prices |
| `/api/osm-stations` | GET | OpenStreetMap station lookup via Overpass API |
| `/api/station-submissions` | GET | List station submissions (`?status&limit`) |
| `/api/notifications` | POST/DELETE | FCM token subscribe/unsubscribe |
| `/api/admin/[...slug]` | various | Admin-only operations |
| `/api/ai/station-recommendation` | POST | GPT-4o-mini station recommendation chat |
| `/api/webhooks/scraper` | POST | Webhook from Cloud Functions to revalidate Next.js cache |

---

## 10. Auth & Roles

### Roles

```ts
type UserRole = 'user' | 'moderator' | 'admin' | 'superadmin'
```

`superadmin` passes all `requireRole()` checks implicitly.

### Guard functions (`lib/auth/guards.ts`)

```ts
requireAuth(): Promise<SessionUser>
// Reads session cookie. No session → redirect('/')

requireRole(allowedRoles: UserRole[]): Promise<SessionUser>
// Calls requireAuth() first. superadmin bypasses all checks.
// Role not in allowedRoles → redirect('/dashboard')

requireSuperadmin(): Promise<SessionUser>
// Only 'superadmin' passes. Others → redirect('/dashboard')

getOptionalSession(): Promise<SessionUser | null>
// Returns session without redirecting
```

### Route group enforcement

| Route group | Layout guard |
|---|---|
| `(marketing)` | None — fully public |
| `(auth)` | None — unauthenticated only |
| `(app)` | `requireAuth()` |
| `(protected-admin)` | `requireRole(['admin'])` |
| `(protected-moderator)` | `requireRole(['moderator', 'admin'])` |
| `superadmin/` | `requireSuperadmin()` |

---

## 11. Firebase Cloud Functions

Separate npm workspace in `functions/`. CommonJS, Node 20, Firebase Functions v5.

### `scheduledScrape` — every 6 hours

```
functions/src/scheduled/scrape-prices.ts
```

1. Runs scrapers in parallel: `scrapeDOEPH`, `scrapePetron`, `scrapeShell`, `scrapeSeaOil`
2. Uses `Promise.allSettled` — individual scraper failures don't abort the run
3. Batch-writes results to `priceSnapshots` collection (`merge: true`)
4. If `NEXT_APP_URL` + `WEBHOOK_SECRET` are set, POSTs to `/api/webhooks/scraper` to revalidate Next.js cache

### `onReportValidated` — Firestore trigger

```
functions/src/triggers/on-report-validated.ts
Trigger: onDocumentUpdated('priceReports/{reportId}')
```

Fires when a `priceReport` document changes. Acts only when `before.status !== 'confirmed'` and `after.status === 'confirmed'`.

1. Reads existing `fuelPrices/{stationId_fuelType}` for `oldPrice`
2. Writes `fuelPrices/{stationId_fuelType}` with `sourceType: 'community'`, `badge: 'community-verified'`
3. Appends to `priceHistory`
4. Updates `stations/{stationId}.latestPrices.{fuelType}`
5. Fetches all FCM tokens from `pushSubscriptions`
6. Sends FCM multicast push notification via `sendPriceUpdateNotification()`

> **Note:** This is a secondary write path for resilience. The primary confirmation path is `castVoteAction()` in the Server Action, which also calls `upsertConfirmedPrice()` directly.

### `onUserCreatedHandler` — Firebase Auth trigger

```
functions/src/triggers/on-user-created.ts
Trigger: Firebase Auth v1 auth.user().onCreate()
```

Creates `users/{uid}` with defaults:
- `role: 'user'`, `trustScore: 0`, `reportCount: 0`, `confirmedReportCount: 0`
- Uses `set(..., { merge: true })` — safe to run on existing docs

### `sendPriceUpdateNotification()` (`functions/src/utils/notify.ts`)

```ts
sendPriceUpdateNotification(params: {
  stationName: string
  fuelType: string
  newPrice: number
  tokens: string[]
}): Promise<void>
```

Sends FCM multicast. Notification body: `"{fuelType} is now ₱{price}/L"`. Icon: `/icons/icon-192x192.png`.

---

## 12. Type Definitions

### `types/station.ts`

```ts
type FuelType = 'gasoline' | 'premium' | 'diesel' | 'kerosene' | 'lpg'
type PriceSourceType = 'scraped' | 'community' | 'admin'
type PriceBadge = 'admin-verified' | 'community-verified' | 'pending-update' | 'baseline' | 'stale'

interface Station {
  id: string
  name: string
  brand: string | null
  address: string | null
  barangay: string | null
  city: string
  province: string
  latitude: number
  longitude: number
  fuelTypes: FuelType[]
  latestPrices: Partial<Record<FuelType, StationPrice>>
  lastUpdatedAt: string | null
  createdAt: string
  updatedAt: string
  dataSource?: string
  externalId?: string
}

interface StationPrice {
  price: number
  sourceType: PriceSourceType
  badge: PriceBadge
  updatedAt: string
  confirmationCount: number
}

interface StationListItem {
  id: string
  name: string
  brand: string | null
  city: string
  province: string
  latitude: number
  longitude: number
  lowestPrice: number | null
  lowestFuelType: FuelType | null
  distanceKm?: number
}
```

### `types/report.ts`

```ts
type ReportStatus = 'pending' | 'confirmed' | 'rejected' | 'expired' | 'flagged'
type VoteType = 'confirm' | 'reject' | 'flag'

interface PriceReport {
  id: string
  stationId: string
  fuelType: FuelType
  reportedPrice: number
  normalizedPrice: number
  baselinePrice?: number
  priceDeltaPercent?: number
  reporterId: string
  evidenceUrl: string | null
  status: ReportStatus
  confirmCount: number
  rejectCount: number
  flagCount: number
  validatorThreshold?: number
  confirmationCount?: number
  expiresAt: string
  confirmedAt?: string
  createdAt: string
  updatedAt: string
}

interface ValidationVote {
  id: string
  reportId: string
  userId: string
  voteType: VoteType
  votedAt: string
}
```

### `types/auth.ts`

```ts
type UserRole = 'user' | 'moderator' | 'admin' | 'superadmin'

interface SessionUser {
  uid: string
  email: string
  displayName: string
  photoURL: string
  role: UserRole
}

interface UserProfile {
  uid: string
  displayName: string
  email: string
  photoURL: string
  role: UserRole
  trustScore: number
  reportCount: number
  confirmedReportCount: number
  createdAt: string
  updatedAt: string
}
```

### `types/price.ts`

```ts
interface FuelPrice {
  id: string  // "{stationId}_{fuelType}"
  stationId: string
  fuelType: FuelType
  currentPrice: number
  sourceType: PriceSourceType
  confirmedReportId: string | null
  confirmationCount: number
  updatedAt: string
}

interface PriceHistory {
  id: string
  stationId: string
  fuelType: FuelType
  oldPrice: number | null
  newPrice: number
  sourceType: PriceSourceType
  reportId: string | null
  changedAt: string
}
```

### `types/route.ts`

```ts
interface RoutePoint {
  lat: number
  lng: number
  address: string
  name?: string
}

interface RouteInfo {
  startPoint: RoutePoint
  endPoint: RoutePoint
  distance: number   // km
  duration: number   // minutes (Philippines-adjusted)
  providerDuration?: number
  coordinates: [number, number][]
}
```

### `types/station-submission.ts`

```ts
type StationSubmissionStatus = 'pending' | 'approved' | 'rejected'
type StationSubmissionVoteType = 'legit' | 'not_legit'

interface StationSubmissionListItem {
  id: string
  name: string
  brand: string
  address: string
  city: string
  province: string
  latitude: number
  longitude: number
  fuelTypes: FuelType[]
  status: StationSubmissionStatus
  legitCount: number
  notLegitCount: number
  legitThreshold: 46
  rejectThreshold: 6
  submittedBy: string
  submittedByName: string
  submittedByEmail: string
  createdAt: string
  updatedAt: string
  approvedAt?: string
  approvedBy?: string
  rejectedAt?: string
  rejectedBy?: string
  promotedStationId?: string
}
```

### `types/api.ts`

```ts
interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}
```

---

## 13. Custom Hooks

### `use-auth.ts`

Subscribes to Firebase Auth `onAuthStateChanged`. Returns `{ user: FirebaseUser | null, loading: boolean }`.

### `use-geolocation.ts`

Wraps the browser Geolocation API. Options: `{ auto: boolean }` to trigger on mount. Returns `{ position, error, loading, requestLocation }`.

### `use-user-location.ts`

Combines `useGeolocation` with a default fallback (Trinoma, QC: `{ lat: 14.6528, lng: 121.0329 }`) for when GPS is unavailable.

### `use-stations.ts`

TanStack Query hook. Fetches station list from `/api/stations` with configurable query params. Returns `{ stations, isLoading, error, refetch }`.

### `use-route-calculation.ts`

```ts
{
  geocodeAddress(address: string): Promise<RoutePoint | null>
  // GET Geoapify /v1/geocode/search?filter=countrycode:ph

  fetchAutocompleteSuggestions(query: string): Promise<RoutePoint[]>
  // GET Geoapify /v1/geocode/autocomplete?filter=countrycode:ph

  fetchRecommendedDestinations(lat, lng, offset?, limit?): Promise<RoutePoint[]>
  // GET Geoapify /v2/places?categories=shopping_mall,attraction,entertainment,restaurant
  // &filter=circle:{lng},{lat},10000

  calculateRoute(start, end): Promise<RouteInfo | null>

  calculateRouteWithWaypoints(points: RoutePoint[]): Promise<RouteInfo | null>
  // Geoapify /v1/routing?mode=drive
  // Applies Philippines-adjusted duration multiplier

  loading: boolean
  error: string | null
}
```

### `use-validation-votes.ts`

Two real-time Firestore hooks:

```ts
useValidationVotes(reportId: string): { votes: ValidationVote[], loading: boolean }
// onSnapshot: priceReports/{reportId}/votes subcollection

usePendingReports(): { reports: PriceReport[], loading: boolean }
// onSnapshot: priceReports where status == 'pending'
```

Both auto-unsubscribe on unmount.

### `use-push-notifications.ts`

Requests FCM permission, retrieves the device token, and calls `subscribeToPushAction(token)`. Manages permission state and token registration lifecycle.

### `use-pwa-install.ts`

Captures the `beforeinstallprompt` browser event and exposes `{ canInstall, install() }` for the `<InstallPrompt />` component.

---

## 14. Feature Slices

### `src/features/gas-prices/`

Community gas prices feature.

**Exports:**
- `GasPricesPage`, `GasPriceFilters`, `GasPriceList`, `GasPriceCard` — UI components
- `useGasPrices` — TanStack Query hook wrapping `fetchCommunityGasPrices()`
- `fetchCommunityGasPrices(): Promise<CommunityPricesResponse>` — `GET /api/community-prices`
- `transformCommunityPrices(data): GasPriceItem[]` — flattens nested map to array
- `formatFuelType(fuelType: string): string` — human-readable fuel type label

**Types:**
```ts
interface CommunityPriceEntry { price, note, timestamp, count }
type CommunityPricesMap = Record<string, Record<string, CommunityPriceEntry>>
// stationId → fuelType → CommunityPriceEntry

interface CommunityPricesResponse { communityPrices: CommunityPricesMap }
interface GasPriceItem { stationId, fuelType, price, note, timestamp, reportCount }
```

### `src/features/osm-stations/`

OpenStreetMap station import feature.

**Exports:**
- `useOsmStations` — TanStack Query hook wrapping `fetchOsmStations()`
- `fetchOsmStations(): Promise<OverpassResponse>` — `GET /api/osm-stations`
- `transformOverpassStations(response): OsmStation[]` — normalizes Overpass nodes/ways/relations

**Types:**
```ts
interface OverpassElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number; lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

interface OsmStation {
  id: string
  name: string
  brand: string
  operator: string
  city: string
  province: string
  latitude: number
  longitude: number
}
```

---

## 15. Business Rules & Validation Logic

| Rule | Detail |
|---|---|
| Report cooldown | Cannot submit a duplicate `(stationId, fuelType)` report while one is pending/confirmed within `reportCooldownHours` |
| Price tolerance | If a fresh price exists (< `stalePriceDays` old), the new report's price must be within `priceTolerancePercent` of the current price |
| Confirmation threshold | `minConfirmations` confirm votes → status = `confirmed`, triggers `upsertConfirmedPrice()` |
| Rejection threshold | `minConfirmations` reject votes → status = `rejected` |
| Flag threshold | `flagThreshold` flag votes → status = `flagged` |
| Self-voting | Cannot vote on your own report |
| Double-voting | Cannot vote more than once on the same report (enforced via per-user vote doc) |
| Report expiry | Reports expire after `reportExpiryHours`; expired reports cannot be voted on |
| Trust score | Each confirmed report gives the original reporter `+5` trust score |
| Station submission — promote | `46` legit votes auto-promotes a submission to the `stations` collection |
| Station submission — reject | `6` not_legit votes auto-rejects a submission |
| Admin override | Admins can bypass all thresholds to approve/reject station submissions or set prices directly |
| Superadmin | Passes all `requireRole()` checks regardless of which roles are specified |
| Price badge | `admin` source → `admin-verified`, `community` source → `community-verified`, else → `baseline` |
| Station ID — GasWatch | `gaswatch-{externalId}` |
| Station ID — community submission | `community-{submissionId}` |

All thresholds (`minConfirmations`, `reportCooldownHours`, `stalePriceDays`, `priceTolerancePercent`, `reportExpiryHours`, `flagThreshold`) are stored in the `systemConfig` Firestore document and editable by admins at runtime via `/admin/config`.

---

## 16. Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Signed-in users can read these collections (for real-time subscriptions):
    match /systemConfig/{documentId}                       { allow read: if signedIn(); }
    match /priceReports/{reportId}                         { allow read: if signedIn(); }
    match /priceReports/{reportId}/votes/{voteId}          { allow read: if signedIn(); }
    match /stationSubmissions/{submissionId}               { allow read: if signedIn(); }
    match /stationSubmissions/{submissionId}/votes/{voteId} { allow read: if signedIn(); }

    // Everything else is denied at the client level
    match /{document=**} { allow read, write: if false; }
  }
}
```

All writes go through Next.js Server Actions using the Firebase Admin SDK, which bypasses these rules entirely. Client-side SDK is only used for real-time `onSnapshot` reads on `priceReports` and their `votes` subcollections (the `/validate` page).

---

## 17. External Services

| Service | Usage | Key env var |
|---|---|---|
| Firebase Auth | Google OAuth sign-in, session cookie verification | `NEXT_PUBLIC_FIREBASE_*`, `FIREBASE_ADMIN_*` |
| Firestore | All application data | same as above |
| Firebase Cloud Messaging | Push notifications | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` |
| Firebase Cloud Functions | Background scraping + Firestore triggers | deployed separately |
| Geoapify | Geocoding, address autocomplete, routing, POI search | `NEXT_PUBLIC_GEOAPIFY_API_KEY` |
| GasWatchPH | Live national fuel price feed | `GASWATCHPH_DATA_URL` (optional override) |
| OpenStreetMap / Overpass API | Gas station location data import | no key required |
| OpenAI | GPT-4o-mini for AI station recommendation | `OPENAI_API_KEY` |
