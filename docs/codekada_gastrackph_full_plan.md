# CodeKada GasTrackPH — Full System Evaluation and Implementation Plan

**Project name:** CodeKada GasTrackPH  
**Product purpose:** A Philippine fuel-price tracking web application focused on **Metro Manila** and **CALABARZON**, where station-level prices are initialized from external public price data, then improved through authenticated community reports and a multi-user validation handshake.  
**Prepared for:** CodeKada System / Gas Price Tracker project  
**Target deployment:** Vercel (primary), Netlify (fallback)  
**Target database:** MongoDB via Prisma ORM  
**Target map/routing layer:** `maps-api` abstraction + Geoapify routing/directions  
**Target vehicle-cost layer:** displacement-based vehicle cost estimator + `autocosts`-inspired cost model  

**Architecture note:** This revised plan prioritizes Vercel as the primary deployment platform for the Next.js frontend and server runtime while keeping Netlify as a supported fallback host. Prisma remains the application data layer, and the database is a non-relational document store modeled through Prisma's MongoDB support. PostgreSQL remains a relational engine, so the non-relational Prisma path should be treated as MongoDB-style document modeling rather than SQL tables.

---

## 1. Executive Summary

CodeKada GasTrackPH should be designed as a **community-verified fuel intelligence platform**. The system must not only show fuel prices, but also determine whether those prices are reliable, fresh, location-specific, and economically useful for the driver.

The system will begin by scraping station and price data from **GasWatchPH** as an initial source. The scraped data should be treated as a **baseline reference**, not as the final source of truth. Since pump prices can vary per branch, city, fuel type, and time of update, the application must allow authenticated users to submit observed prices. A submitted price must remain pending until it passes a **minimum 4-user validation handshake**.

The main differentiator of CodeKada GasTrackPH is the **consensus engine**:

- Scraped fuel prices are displayed as initial values.
- Users can submit live observed prices per station and fuel type.
- A submitted price is not automatically confirmed.
- At least **4 unique users** must report comparable prices within a configured freshness window.
- Reports are clustered by price closeness.
- The system computes the most statistically reliable consensus price.
- Admins and supervisors may override, correct, or hardcode prices when required.

The system should also help users answer a practical question:

> “Is it actually worth driving to this cheaper gas station?”

To answer that, the platform will combine:

1. Station-level fuel price.
2. User location.
3. Geoapify route distance and duration.
4. Vehicle displacement-based consumption estimate.
5. Fuel type and expected fill volume.
6. Total estimated detour cost versus expected savings.

---

## 2. Current System Evaluation Scope

No repository, source files, schema, or live CodeKada codebase was attached with the prompt. Therefore, this document is written as a **codebase evaluation plan and implementation roadmap** rather than a line-by-line code audit.

When the actual CodeKada system is available, evaluate it against these areas:

| Area | What to Evaluate | Expected Output |
|---|---|---|
| Authentication | Existing login/logout, session handling, OAuth readiness | Auth gap report |
| Database | Current Prisma schema, document collections, indexes, seed data | Prisma NoSQL data model review plan |
| Map UI | Existing station map, marker rendering, filters | Map integration plan |
| Scraper | Existing scraping logic, source reliability, data normalization | Scraper pipeline plan |
| Price Validation | Whether community reports exist and how they are confirmed | Consensus engine plan |
| Admin Tools | Price overrides, user moderation, station CRUD | Admin/supervisor dashboard plan |
| Routing | Route/distance/duration support | Geoapify route module plan |
| Vehicle Costing | Consumption estimates, cost-per-trip logic | Vehicle cost model plan |
| Deployment | Vercel config, environment variables, Netlify fallback parity, build scripts | Deployment checklist |
| Security | Rate limits, abuse prevention, role-based access | Security hardening plan |

---

## 3. Product Scope

### 3.1 Geographic Scope

Initial supported regions:

1. **Metro Manila**
2. **CALABARZON**
   - Cavite
   - Laguna
   - Batangas
   - Rizal
   - Quezon

Recommended rollout order:

1. Metro Manila
2. Rizal
3. Cavite
4. Laguna
5. Batangas
6. Quezon

This order is recommended because Metro Manila, Rizal, and Cavite are more likely to have immediate station data coverage from the chosen public source, while the remaining CALABARZON provinces may require more manual seeding or community/user submissions.

---

### 3.2 Fuel Price Scope

The application should support these fuel categories:

- Diesel
- Premium Diesel
- Unleaded 91
- E-Gasoline
- Premium 95
- Premium 97
- Kerosene
- LPG / Gasul, optional second-stage feature

The first production release should focus on:

1. Diesel
2. Unleaded 91
3. Premium 95

Other fuel types can be added after station and validation logic is stable.

---

## 4. Core Product Goals

### 4.1 Primary Goals

- Track station-level fuel prices in Metro Manila and CALABARZON.
- Initialize prices through scraped public data.
- Let users report updated pump prices.
- Require at least 4 unique user reports before confirming community changes.
- Use statistical comparison to reject outliers and noisy reports.
- Display stations on a map with fuel price markers.
- Allow users to calculate whether traveling to a cheaper station is worth it.
- Support login/logout and Google OAuth.
- Use Prisma, a non-relational document database, and deploy to Vercel first while keeping Netlify as a fallback option.
- Provide admin/supervisor override controls.

### 4.2 Secondary Goals

- Build a price history per station and fuel type.
- Show confidence scores and freshness labels.
- Detect suspicious user behavior.
- Add vehicle profiles for personalized cost estimation.
- Cache routes and station queries to reduce API cost.
- Support future expansion beyond Metro Manila and CALABARZON.

### 4.3 Non-Goals for the First Release

- Real-time nationwide coverage.
- Guaranteed official pump-price certification.
- Payment features.
- Complex fleet-management tools.
- Native mobile application.
- AI prediction of future fuel prices.
- Direct integration with gasoline companies.

---

## 5. High-Level Architecture

```mermaid
flowchart TD
    A[GasWatchPH Public Pages] --> B[Scraper Worker]
    B --> C[Scrape Staging Table]
    C --> D[Data Normalizer]
    D --> E[Stations + Fuel Prices]

    U[Authenticated Users] --> F[Price Report Form]
    F --> G[Pending Price Reports]
    G --> H[Consensus Engine]
    H --> I[Confirmed Community Price]
    H --> J[Rejected / Expired Reports]

    I --> E
    K[Admin / Supervisor] --> L[Admin Override Panel]
    L --> E

    E --> M[Map UI]
    E --> N[Station Detail Page]
    E --> O[Price Comparison Table]

    P[User Location] --> Q[Geoapify Routing]
    E --> Q
    R[Vehicle Profile] --> S[Trip Cost Calculator]
    Q --> S
    E --> S

    S --> T[Efficiency Recommendation]
```

---

## 6. Recommended Tech Stack

### 6.1 Frontend

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Server Components where applicable
- Client Components for map, routing, report forms, and interactive filters
- Optional UI library: shadcn/ui

### 6.2 Backend

- Next.js Route Handlers
- Prisma ORM
- MongoDB document database
- Server-side scraper worker
- Server-side validation engine
- Vercel Functions / Next.js server runtime, with Netlify as a secondary host option

### 6.3 Authentication

- Firebase Authentication
- Google OAuth provider
- Firebase Admin session verification / session cookies
- Role-based access control

### 6.4 Maps and Routing

- `maps-api` package should be wrapped in a project-level adapter, not directly scattered across UI components.
- Geoapify Routing API for route distance, duration, and directions.
- Optional `@geoapify/route-directions` component for route UI if it fits the frontend design.

### 6.5 Vehicle Cost Calculation

- Use internal vehicle-cost formulas for runtime estimation.
- Use `autocosts` as a reference or optional service module, because it is a full-stack calculator project rather than a tiny formula-only utility package.
- Store project-specific displacement presets in the database through Prisma so admins can adjust values without code changes.

---

## 7. External Source and Package Notes

### 7.1 GasWatchPH

GasWatchPH should be used as an initial public data source only. It should not be treated as the permanent source of truth for CodeKada.

Observed source behavior:

- Tracks fuel prices across Metro Manila and surrounding provinces.
- Combines DOE weekly advisories with community-reported pump prices.
- Displays city, brand, fuel type, and station-level price information.
- Includes a map-style station browsing experience.

Implementation implications:

- Scraped records should be stored with `source = SCRAPED`.
- Scraped records should have lower trust priority than admin overrides and confirmed community consensus.
- Scraped data must be normalized into CodeKada's own schema.
- The UI should display source/freshness labels to avoid misleading users.

### 7.2 `maps-api`

The package should be evaluated inside a controlled `MapProvider` abstraction. Do not couple business logic directly to this package.

Required map features:

- Render station markers.
- Support user geolocation.
- Support marker clustering if station density is high.
- Support station click popup.
- Support filters by region, city, brand, and fuel type.

Fallback plan:

- If `maps-api` lacks required production features, replace the adapter with Google Maps, MapLibre, Leaflet, or another compatible provider without changing the rest of the application.

### 7.3 Geoapify Routing

Geoapify should be used for distance, duration, and route geometry.

Required routing features:

- Current user location to selected gas station.
- Distance in kilometers.
- Duration in minutes.
- Driving mode.
- Optional avoid parameters in future versions.
- Route cache to reduce API calls.

### 7.4 `autocosts`

`autocosts` should not be blindly installed and treated as a simple calculation library. It is better viewed as a full-stack reference implementation for vehicle ownership and running-cost calculations.

Recommended approach:

1. Install and inspect package behavior in a sandbox branch.
2. Identify reusable formulas or country/currency configuration.
3. Reimplement the required runtime formulas inside CodeKada.
4. Keep only the cost-calculation logic needed for Philippine peso fuel-cost estimation.

---

## 8. Core System Modules

```mermaid
flowchart LR
    A[Auth Module] --> B[User Profile Module]
    B --> C[Vehicle Profile Module]
    D[Scraper Module] --> E[Station Data Module]
    F[Price Report Module] --> G[Consensus Engine]
    G --> E
    H[Admin Module] --> E
    E --> I[Map Module]
    E --> J[Station Search Module]
    E --> K[Route Cost Module]
    C --> K
    L[Geoapify Module] --> K
```

### 8.1 Auth Module

Responsibilities:

- User registration.
- Login/logout.
- Google OAuth.
- Session management.
- Role-based access.
- User trust score foundation.

Required roles:

| Role | Description |
|---|---|
| `USER` | Can view stations, submit price reports, save vehicles |
| `VALIDATOR` | Trusted user whose reports may carry higher confidence later |
| `SUPERVISOR` | Can review reports, correct data, and manage station issues |
| `ADMIN` | Full control over users, stations, prices, scraper, and settings |

---

### 8.2 Station Data Module

Responsibilities:

- Store gas station master records.
- Store brand, address, city, province, region, latitude, longitude.
- Store supported fuel types per station.
- Store active display price per station and fuel type.
- Store price history.
- Allow admin edits.

Station quality fields:

- `isVerifiedLocation`
- `locationConfidence`
- `lastScrapedAt`
- `lastCommunityConfirmedAt`
- `lastAdminUpdatedAt`
- `dataCompletenessScore`

---

### 8.3 Scraper Module

Responsibilities:

- Fetch public source pages.
- Parse station data.
- Normalize fuel types.
- Match scraped stations to existing database stations.
- Insert new station candidates.
- Stage scraped prices before publishing.
- Mark source freshness.

Scraper must not directly overwrite confirmed community/admin prices unless configured to do so.

Recommended scraper priority order:

1. Admin override
2. Confirmed community consensus
3. Fresh scraped source
4. Older scraped source
5. No data

---

### 8.4 Price Report Module

Responsibilities:

- Let users submit observed station prices.
- Prevent duplicate spam reports.
- Attach location, timestamp, fuel type, station, and optional proof metadata.
- Queue reports for consensus evaluation.
- Display pending status to the reporting user.

Recommended input fields:

| Field | Type | Required | Notes |
|---|---:|---:|---|
| Station | Select / hidden station ID | Yes | From station detail or map marker |
| Fuel type | Enum | Yes | Diesel, Unleaded 91, etc. |
| Price | Decimal | Yes | PHP per liter |
| User location | Coordinates | Optional | Only with permission |
| Photo proof | Image | Optional | Future enhancement |
| Notes | Text | Optional | For station-specific comments |

---

### 8.5 Consensus Engine

Responsibilities:

- Compare pending user reports.
- Require minimum 4 unique users.
- Group reports by station, fuel type, and time window.
- Remove outliers.
- Compute consensus price.
- Publish confirmed community price.
- Expire old pending reports.
- Track trust/reliability score.

---

### 8.6 Map Module

Responsibilities:

- Display stations in supported regions.
- Show marker color based on selected fuel type price.
- Show no-data markers differently.
- Allow filtering by brand, city, province, and fuel type.
- Show station popup with price, source, freshness, and confidence.
- Provide “Report Price” action.
- Provide “Calculate Route Cost” action.

---

### 8.7 Route Cost Module

Responsibilities:

- Calculate distance and duration from user to station.
- Estimate fuel consumed to reach station.
- Estimate cost of detour.
- Compare station price savings versus travel cost.
- Recommend whether the trip is worth it.

---

### 8.8 Vehicle Cost Module

Responsibilities:

- Store user vehicle profile.
- Provide displacement-based fuel-efficiency defaults.
- Let users override actual km/L.
- Calculate estimated cost per trip.
- Support Philippine peso as currency.

---

### 8.9 Admin and Supervisor Module

Responsibilities:

- Create, update, disable, and merge stations.
- Hardcode or override fuel prices.
- View pending reports.
- View rejected/outlier reports.
- Manage scraper jobs.
- Manage user trust and abuse flags.
- Audit all data changes.

---

## 9. Data Trust Hierarchy

The app must clearly separate **where a price came from** and **how reliable it is**.

```mermaid
flowchart TD
    A[Admin Override] --> B[Highest Display Priority]
    C[Confirmed Community Consensus] --> D[High Priority]
    E[Fresh Scraped Data] --> F[Medium Priority]
    G[Old Scraped Data] --> H[Low Priority]
    I[No Data] --> J[Needs User/Admin Update]
```

Recommended source priority:

| Priority | Source | Display Label | Notes |
|---:|---|---|---|
| 1 | Admin override | Admin verified | Used for corrections and official manual updates |
| 2 | Community consensus | Community verified | Requires 4+ unique users |
| 3 | Scraped source | Scraped baseline | Initial/default data |
| 4 | Historical value | Outdated | Shown only with stale warning |
| 5 | No data | No data | User can submit report |

---

## 10. Community Validation / Handshake Method

### 10.1 Main Rule

A user-submitted price should only become confirmed when:

1. At least **4 unique users** report a price.
2. Reports refer to the same:
   - station,
   - fuel type,
   - region/city context,
   - freshness window.
3. Reports pass configured price closeness rules.
4. The accepted cluster has enough confidence.

---

### 10.2 Important Assumption About the Example

The prompt example says:

- A = 80.20
- B = 79.60
- C = 80.00
- D = 79.50

It also says 80.00 and 79.50 are close enough because of a 0.10-cent difference. Mathematically, however:

```text
80.00 - 79.50 = 0.50
```

Therefore this plan assumes the intended tolerance is **₱0.50**, not **₱0.10**.

If the intended tolerance is actually **₱0.10**, then 80.00 and 79.50 should not be considered close.

Recommended configurable values:

```ts
MIN_UNIQUE_REPORTERS = 4
DEFAULT_PRICE_TOLERANCE_PHP = 0.50
STRICT_PRICE_TOLERANCE_PHP = 0.10
REPORT_FRESHNESS_HOURS = 24
MAX_REASONABLE_PRICE_DELTA_FROM_BASELINE = 10.00
DISPLAY_ROUNDING_INCREMENT = 0.10
```

---

### 10.3 Consensus Algorithm

Recommended algorithm:

1. Get all pending reports for the same station and fuel type within the freshness window.
2. Remove reports from duplicate users.
3. Remove impossible values:
   - price <= 0,
   - price too far from source baseline,
   - price outside configured PHP/liter range.
4. Sort prices ascending.
5. Build clusters where the difference between the minimum and maximum value is within tolerance.
6. Pick the best cluster using:
   - largest unique-user count,
   - lowest variance,
   - newest average timestamp,
   - highest reporter trust score.
7. If the best cluster has at least 4 unique users, confirm the consensus.
8. Use median or trimmed mean as final price.
9. Mark non-cluster reports as outliers or keep them pending until expiration.
10. Write confirmed price to the active station price document or summary record.

---

### 10.4 Example Computation

Reports:

```text
A = 80.20
B = 79.60
C = 80.00
D = 79.50
```

With tolerance = ₱0.50:

```text
Cluster 1: 79.50, 79.60, 80.00
Range: 80.00 - 79.50 = 0.50
Cluster accepted range: Yes

80.20 is not automatically accepted into this cluster because:
80.20 - 79.50 = 0.70
```

Possible confirmed result:

```text
Accepted cluster = [79.50, 79.60, 80.00]
Mean = 79.70
Median = 79.60
Recommended display price = 79.70 if using mean
Recommended display price = 79.60 if using median
```

Recommended production rule:

```text
Use median when reports are noisy.
Use mean only when cluster variance is low.
```

Recommended output for this example:

```text
Consensus price: ₱79.60/L or ₱79.70/L depending on configured method.
Confidence: medium, because only 3 reports fit the strongest cluster.
Status: still pending if 4 matching reports are strictly required.
```

This is important: if the rule requires **4 matching reports**, then the example does not yet fully confirm the price because only 3 values fit the strongest tolerance cluster. The system can either:

- keep it pending until another report arrives near ₱79.50–₱80.00, or
- allow supervisor review when 3 of 4 reports strongly agree.

Recommended setting for production:

```text
Strict mode: require 4 reports inside the accepted cluster.
Flexible mode: allow 3 of 4 reports plus supervisor review.
```

---

### 10.5 Consensus Engine Pseudocode

```ts
type PriceReport = {
  id: string;
  userId: string;
  stationId: string;
  fuelType: FuelType;
  price: number;
  createdAt: Date;
  trustScore: number;
};

function calculateConsensus(reports: PriceReport[]) {
  const uniqueReports = removeDuplicateUserReports(reports);

  if (uniqueReports.length < MIN_UNIQUE_REPORTERS) {
    return { status: "PENDING_NOT_ENOUGH_USERS" };
  }

  const cleanedReports = uniqueReports.filter((report) => {
    return isValidPrice(report.price) && isWithinFreshnessWindow(report.createdAt);
  });

  const sorted = cleanedReports.sort((a, b) => a.price - b.price);
  const clusters = buildPriceClusters(sorted, DEFAULT_PRICE_TOLERANCE_PHP);

  const bestCluster = clusters.sort((a, b) => {
    if (b.uniqueUserCount !== a.uniqueUserCount) {
      return b.uniqueUserCount - a.uniqueUserCount;
    }

    if (a.variance !== b.variance) {
      return a.variance - b.variance;
    }

    return b.averageTrustScore - a.averageTrustScore;
  })[0];

  if (!bestCluster || bestCluster.uniqueUserCount < MIN_UNIQUE_REPORTERS) {
    return { status: "PENDING_NO_VALID_CLUSTER", clusters };
  }

  const consensusPrice = median(bestCluster.prices);

  return {
    status: "CONFIRMED",
    consensusPrice,
    confidenceScore: calculateConfidence(bestCluster),
    acceptedReportIds: bestCluster.reportIds,
    rejectedReportIds: getOutlierReportIds(cleanedReports, bestCluster),
  };
}
```

---

## 11. Price Freshness Rules

Recommended freshness labels:

| Freshness | Time Since Update | UI Label |
|---|---:|---|
| Live | 0–6 hours | Updated recently |
| Fresh | 6–24 hours | Fresh community data |
| Acceptable | 1–3 days | Recently updated |
| Stale | 3–7 days | May have changed |
| Very stale | 7+ days | Verify before relying |

For scraped DOE-advisory-based data, show:

```text
Baseline price from public source / DOE advisory. Actual pump price may vary.
```

---

## 12. Database Design

### 12.1 Core Document Domains

This backend should be modeled as a **document database** rather than as normalized SQL tables. The logical domains still exist, but they should be represented as top-level collections plus embedded subdocuments where that reduces joins and read complexity.

Recommended top-level domains:

- `users`
- `stations`
- `priceReports`
- `vehicleProfiles`
- `routeCache`
- `scrapeBatches`
- `auditLogs`
- `systemConfig`

---

### 12.2 Suggested Prisma MongoDB Schema Draft

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

enum UserRole {
  USER
  VALIDATOR
  SUPERVISOR
  ADMIN
}

enum FuelTypeCode {
  DIESEL
  PREMIUM_DIESEL
  UNLEADED_91
  E_GASOLINE
  PREMIUM_95
  PREMIUM_97
  KEROSENE
  LPG
}

enum PriceSource {
  SCRAPED
  COMMUNITY_CONSENSUS
  ADMIN_OVERRIDE
  HISTORICAL
}

enum PriceReportStatus {
  PENDING
  CONFIRMED
  REJECTED
  EXPIRED
  NEEDS_SUPERVISOR_REVIEW
}

enum VoteType {
  CONFIRM
  REJECT
  FLAG
}

type StationPrice {
  fuelType          FuelTypeCode
  price             Float?
  source            PriceSource
  confidenceScore   Float
  isNoData          Boolean
  confirmationCount Int
  updatedAt         DateTime
}

type ValidationVote {
  userId   String
  voteType VoteType
  votedAt  DateTime
}

type ScrapedSnapshot {
  sourceName      String
  sourceUrl       String
  rawBrand        String?
  rawStationName  String?
  rawAddress      String?
  rawCity         String?
  rawProvince     String?
  rawFuelType     String?
  rawPrice        String?
  normalizedPrice Float?
  scrapedAt       DateTime
}

model User {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  firebaseUid String?  @unique
  displayName String?
  email       String?  @unique
  photoUrl    String?
  role        UserRole @default(USER)
  trustScore  Float    @default(1.0)
  isBanned    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Station {
  id                     String          @id @default(auto()) @map("_id") @db.ObjectId
  slug                   String          @unique
  name                   String
  brand                  String?
  address                String?
  city                   String
  province               String
  region                 String
  latitude               Float?
  longitude              Float?
  fuelTypes              FuelTypeCode[]
  latestPrices           StationPrice[]
  scrapedSnapshots       ScrapedSnapshot[]
  isActive               Boolean         @default(true)
  isVerifiedLocation     Boolean         @default(false)
  locationConfidence     Float           @default(0.5)
  lastScrapedAt          DateTime?
  lastCommunityUpdatedAt DateTime?
  lastAdminUpdatedAt     DateTime?
  createdAt              DateTime        @default(now())
  updatedAt              DateTime        @updatedAt

  @@index([city, brand])
  @@index([province, region])
}

model PriceReport {
  id                 String            @id @default(auto()) @map("_id") @db.ObjectId
  stationId          String            @db.ObjectId
  reporterUserId     String            @db.ObjectId
  fuelType           FuelTypeCode
  reportedPrice      Float
  normalizedPrice    Float
  baselinePrice      Float?
  priceDeltaPercent  Float?
  evidenceUrl        String?
  status             PriceReportStatus @default(PENDING)
  confirmCount       Int               @default(0)
  rejectCount        Int               @default(0)
  flagCount          Int               @default(0)
  validatorThreshold Int               @default(4)
  votes              ValidationVote[]
  expiresAt          DateTime
  createdAt          DateTime          @default(now())
  updatedAt          DateTime          @updatedAt

  @@index([stationId, fuelType, status])
  @@index([reporterUserId, createdAt])
}

model VehicleProfile {
  id                 String       @id @default(auto()) @map("_id") @db.ObjectId
  userId             String       @db.ObjectId
  label              String
  displacementLiters Float
  fuelTypePreference FuelTypeCode?
  customKmPerLiter   Float?
  tankCapacityLiters Float?
  isDefault          Boolean      @default(false)
  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @updatedAt

  @@index([userId, isDefault])
}

model RouteCache {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  stationId    String   @db.ObjectId
  originLat    Float
  originLng    Float
  distanceKm   Float
  durationMin  Float
  provider     String   @default("geoapify")
  responseHash String?
  expiresAt    DateTime
  createdAt    DateTime @default(now())

  @@index([stationId, expiresAt])
}

model AuditLog {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  actorUserId String?
  action      String
  entityType  String
  entityId    String?
  oldValue    Json?
  newValue    Json?
  createdAt   DateTime @default(now())

  @@index([entityType, entityId])
}
```

Recommended NoSQL note: use embedded documents for `latestPrices`, report votes, and scraped snapshots where that improves read performance, and keep top-level collections for high-write or independently queried records such as `stations`, `priceReports`, and `vehicleProfiles`.

---

## 13. Scraping and Data Ingestion Plan

### 13.1 Scraper Rules

The scraper should:

- Respect the source website's terms, robots rules, and rate limits.
- Use reasonable request intervals.
- Cache results.
- Avoid aggressive high-frequency scraping.
- Store raw scraped data before normalization.
- Never overwrite admin-confirmed values without explicit configuration.

### 13.2 Scraper Flow

```mermaid
sequenceDiagram
    participant Cron as Scheduled Job
    participant Scraper as Scraper Service
    participant Source as GasWatchPH
    participant DB as MongoDB via Prisma
    participant Normalizer as Normalizer

    Cron->>Scraper: Start scrape job
    Scraper->>Source: Fetch target city/brand pages
    Source-->>Scraper: HTML response
    Scraper->>DB: Insert ScrapeBatch
    Scraper->>DB: Insert raw ScrapedPrice rows
    Normalizer->>DB: Match brand/city/station/fuel type
    Normalizer->>DB: Update scraped baseline prices
    Normalizer->>DB: Flag unmatched stations for admin review
```

### 13.3 Scraper Targets

Initial scraping target pages should be grouped by:

- Home / all stations page
- City pages
- Brand pages
- Province pages where available

Recommended seed pages:

- Metro Manila landing page
- Quezon City
- Manila
- Makati
- Pasig
- Taguig
- Antipolo
- Cainta
- Cavite province pages
- Rizal province pages

### 13.4 Data Normalization Rules

Normalize brand names:

```text
PETRON -> Petron
SHELL -> Shell
CALTEX -> Caltex
SEAOIL -> Seaoil
UNIOIL -> Unioil
PHOENIX -> Phoenix
CLEANFUEL -> Cleanfuel
TOTAL -> Total
PTT -> PTT
JETTI -> Jetti
FLYING V -> Flying V
```

Normalize fuel types:

```text
Diesel -> DIESEL
Prem Diesel -> PREMIUM_DIESEL
Unleaded 91 -> UNLEADED_91
E-Gas -> E_GASOLINE
Prem 95 -> PREMIUM_95
Prem 97 -> PREMIUM_97
Kerosene -> KEROSENE
```

### 13.5 Station Matching Strategy

Match scraped station to internal station using:

1. Exact brand + exact station name + city.
2. Fuzzy station name + brand + city.
3. Address similarity.
4. Coordinate proximity if available.
5. Admin review for unresolved matches.

Unmatched scraped stations should be inserted into a `station_candidates` or admin review queue before becoming active.

---

## 14. API Route Plan

### 14.1 Public Routes

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/stations` | List stations with filters |
| `GET` | `/api/stations/:id` | Get station details |
| `GET` | `/api/fuel-prices` | Query prices by city, province, brand, fuel type |
| `GET` | `/api/regions` | Get supported regions/provinces/cities |
| `GET` | `/api/brands` | Get station brands |
| `GET` | `/api/fuel-types` | Get supported fuel types |

### 14.2 Authenticated User Routes

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/reports` | Submit fuel price report |
| `GET` | `/api/reports/me` | View user's submitted reports |
| `POST` | `/api/vehicles` | Create vehicle profile |
| `GET` | `/api/vehicles` | List user's vehicle profiles |
| `PATCH` | `/api/vehicles/:id` | Update vehicle profile |
| `DELETE` | `/api/vehicles/:id` | Delete vehicle profile |
| `POST` | `/api/route-cost` | Calculate station route and cost |

### 14.3 Admin/Supervisor Routes

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/admin/reports/pending` | View pending reports |
| `POST` | `/api/admin/reports/:id/approve` | Manually approve report |
| `POST` | `/api/admin/reports/:id/reject` | Reject report |
| `PATCH` | `/api/admin/stations/:id` | Update station |
| `POST` | `/api/admin/stations` | Create station |
| `POST` | `/api/admin/prices/override` | Admin price override |
| `POST` | `/api/admin/scraper/run` | Trigger scraper job |
| `GET` | `/api/admin/scraper/batches` | View scrape history |
| `GET` | `/api/admin/audit-logs` | View audit logs |

---

## 15. Frontend Page Plan

### 15.1 Public Pages

| Page | Route | Description |
|---|---|---|
| Landing | `/` | Product intro, cheapest stations, quick search |
| Map | `/map` | Interactive gas station map |
| Stations | `/stations` | Table/list view with filters |
| Station Detail | `/stations/[slug]` | Price details, source, report action |
| City Prices | `/prices/[province]/[city]` | City-level price board |
| Brand Prices | `/brands/[brand]` | Brand-level station comparison |
| Route Cost | `/route-cost` | Calculator for route + fuel economics |
| Login | `/login` | Google OAuth and credentials login if enabled |

### 15.2 Authenticated Pages

| Page | Route | Description |
|---|---|---|
| Dashboard | `/dashboard` | User summary, reports, saved vehicles |
| My Reports | `/dashboard/reports` | Report status tracking |
| My Vehicles | `/dashboard/vehicles` | Vehicle profiles and km/L settings |
| Saved Stations | `/dashboard/saved-stations` | Favorite stations |

### 15.3 Admin Pages

| Page | Route | Description |
|---|---|---|
| Admin Overview | `/admin` | System health and data summary |
| Station Management | `/admin/stations` | CRUD and duplicate handling |
| Price Reports | `/admin/reports` | Pending/confirmed/rejected reports |
| Price Overrides | `/admin/prices` | Manual hardcoded prices |
| Scraper Jobs | `/admin/scraper` | Run scraper and view batches |
| Users | `/admin/users` | User roles, bans, trust score |
| Audit Logs | `/admin/audit-logs` | Change history |

---

## 16. Map UI Requirements

### 16.1 Marker Behavior

Marker color should indicate price level for selected fuel type:

| Marker State | Meaning |
|---|---|
| Green | Below area average |
| Yellow | Near area average |
| Red | Above area average |
| Gray | No data |
| Blue outline | Community verified |
| Black outline | Admin verified |

### 16.2 Station Popup Content

Each marker popup should show:

- Brand
- Station name
- Address
- City/province
- Fuel prices by type
- Source label
- Last updated timestamp
- Confidence score
- Button: Report Price
- Button: Calculate Route Cost
- Button: Save Station

### 16.3 Filters

Required filters:

- Region
- Province
- City
- Brand
- Fuel type
- Price source
- Confidence level
- Has data / no data
- Cheapest nearby

---

## 17. Route Efficiency and Trip Cost Feature

### 17.1 Purpose

The route-cost feature should prevent users from making bad decisions such as driving too far just to save a small amount per liter.

Example question:

```text
Station A is ₱2/L cheaper, but it is 8 km farther. Is it still worth it?
```

---

### 17.2 Required Inputs

| Input | Source |
|---|---|
| User origin | Browser geolocation or manual input |
| Destination station | Selected station |
| Fuel type | User selected |
| Station price | Active station fuel price |
| Vehicle displacement | Vehicle profile |
| Vehicle km/L | User override or preset |
| Expected liters to fill | User input |
| Route distance | Geoapify |
| Route duration | Geoapify |

---

### 17.3 Calculation Formula

```text
one_way_fuel_used_liters = distance_km / vehicle_km_per_liter
one_way_trip_cost = one_way_fuel_used_liters * selected_fuel_price
round_trip_cost = one_way_trip_cost * 2

fuel_savings = (baseline_price - station_price) * liters_to_fill
net_savings = fuel_savings - round_trip_cost
```

Recommended decision labels:

| Net Savings | Recommendation |
|---:|---|
| `> ₱100` | Worth the trip |
| `₱20 to ₱100` | Slightly worth it |
| `-₱20 to ₱20` | Neutral |
| `< -₱20` | Not worth it |

---

### 17.4 Example

```text
Baseline station price near user: ₱82.00/L
Selected cheaper station price: ₱79.50/L
Liters to fill: 30 L
Route distance one-way: 5 km
Vehicle efficiency: 10 km/L

Fuel savings = (82.00 - 79.50) * 30
Fuel savings = 2.50 * 30
Fuel savings = ₱75.00

Round-trip fuel used = (5 / 10) * 2
Round-trip fuel used = 1.00 L
Round-trip trip cost = 1.00 * 79.50
Round-trip trip cost = ₱79.50

Net savings = 75.00 - 79.50
Net savings = -₱4.50

Recommendation: Not worth it or neutral.
```

---

## 18. Vehicle Displacement Cost Model

### 18.1 Supported Displacements

The system should support these displacement categories:

```text
1.0 L
1.3 L
1.5 L
1.6 L
1.8 L
2.0 L
2.4 L
2.5 L
2.8 L
3.0 L
```

### 18.2 Important Design Note

Engine displacement alone is not enough to accurately determine fuel consumption. Fuel efficiency depends on:

- Vehicle model
- Engine technology
- Fuel type
- Transmission
- Driving style
- Traffic condition
- Tire condition
- Maintenance
- Load/passengers
- City versus highway route

Therefore, displacement should only be used as a **default estimate**. Users must be allowed to override km/L based on their actual vehicle.

---

### 18.3 Suggested Preset Table

These values should be treated as editable seed values, not final truth.

| Displacement | City km/L | Highway km/L | Combined km/L |
|---:|---:|---:|---:|
| 1.0 L | 12.0 | 18.0 | 15.0 |
| 1.3 L | 11.0 | 17.0 | 14.0 |
| 1.5 L | 10.0 | 16.0 | 13.0 |
| 1.6 L | 9.5 | 15.0 | 12.5 |
| 1.8 L | 8.5 | 14.0 | 11.5 |
| 2.0 L | 8.0 | 13.0 | 10.5 |
| 2.4 L | 7.0 | 11.0 | 9.0 |
| 2.5 L | 6.8 | 10.5 | 8.7 |
| 2.8 L | 6.5 | 10.0 | 8.3 |
| 3.0 L | 6.0 | 9.5 | 7.8 |

Admin should be able to edit these presets.

---

## 19. Authentication and Google OAuth Plan

### 19.1 Required Features

- Login with Google.
- Logout.
- Persistent sessions.
- Protected report submission.
- Protected dashboard.
- Admin-only routes.
- Supervisor-only moderation routes.

### 19.2 Auth Setup Steps

1. Create a Firebase project.
2. Enable Firebase Authentication and the Google sign-in provider.
3. Create a Firebase web app for the hosted frontend used by Vercel and, if needed later, Netlify.
4. Add local development as an authorized Firebase Auth domain.
5. Add the Vercel production domain, preview domain if used, custom domain, and optional Netlify fallback domain to Firebase authorized domains.
6. Add `NEXT_PUBLIC_FIREBASE_*` client variables to environment variables.
7. Add `FIREBASE_ADMIN_*` service-account variables for server-side admin access.
8. Configure Firebase Admin SDK and session-cookie verification in server routes.
9. Add session protection to server routes.
10. Add role checks to admin/supervisor pages.

### 19.3 Required Authorized Domains / Origins

For local development:

```text
http://localhost:3000
```

For production:

```text
https://YOUR_VERCEL_PROJECT.vercel.app
https://YOUR_CUSTOM_DOMAIN.com
https://YOUR_NETLIFY_DOMAIN.netlify.app
```

If Google redirect-based sign-in is used instead of popup-based sign-in, register the Firebase-managed redirect endpoint required by your project as well.

---

## 20. Environment Files

### 20.1 `.env.local` for Local Development

```env
# App
NEXT_PUBLIC_APP_NAME="CodeKada GasTrackPH"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# Database
DATABASE_URL="mongodb+srv://USER:PASSWORD@HOST/codekada_gastrackph?retryWrites=true&w=majority"

# Firebase Client (only if Firebase Auth is retained)
NEXT_PUBLIC_FIREBASE_API_KEY="replace_with_firebase_api_key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="replace_with_sender_id"
NEXT_PUBLIC_FIREBASE_APP_ID="replace_with_app_id"

# Firebase Admin (only if Firebase Auth is retained)
FIREBASE_ADMIN_PROJECT_ID="your-project-id"
FIREBASE_ADMIN_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com"
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Maps
NEXT_PUBLIC_MAPS_API_KEY="replace_with_public_map_key_if_required"
MAPS_API_SERVER_KEY="replace_with_server_map_key_if_required"

# Geoapify
GEOAPIFY_API_KEY="replace_with_geoapify_api_key"
NEXT_PUBLIC_GEOAPIFY_API_KEY="replace_only_if_client_component_requires_it"

# Scraper
GASWATCH_BASE_URL="https://gaswatchph.com"
SCRAPER_CRON_SECRET="replace_with_random_secret"
SCRAPER_ENABLED="true"
SCRAPER_RATE_LIMIT_MS="3000"

# Consensus Engine
MIN_UNIQUE_REPORTERS="4"
DEFAULT_PRICE_TOLERANCE_PHP="0.50"
STRICT_PRICE_TOLERANCE_PHP="0.10"
REPORT_FRESHNESS_HOURS="24"
MAX_REASONABLE_PRICE_DELTA_FROM_BASELINE="10.00"

# Admin Seed
SEED_ADMIN_EMAIL="your_admin_email@example.com"
```

---

### 20.2 `.env` / Hosted Production Variables

For production, do not commit `.env` with real secrets. Set these values in Vercel project environment variables first, then mirror the same values into Netlify if you later use the fallback host.

```env
# App
NEXT_PUBLIC_APP_NAME="CodeKada GasTrackPH"
NEXT_PUBLIC_APP_URL="https://YOUR_PRODUCTION_DOMAIN"
NODE_ENV="production"

# Database
DATABASE_URL="mongodb+srv://USER:PASSWORD@HOST/codekada_gastrackph?retryWrites=true&w=majority"

# Firebase Client (only if Firebase Auth is retained)
NEXT_PUBLIC_FIREBASE_API_KEY="production_firebase_api_key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="production_sender_id"
NEXT_PUBLIC_FIREBASE_APP_ID="production_app_id"

# Firebase Admin (only if Firebase Auth is retained)
FIREBASE_ADMIN_PROJECT_ID="your-project-id"
FIREBASE_ADMIN_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com"
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Maps and Routing
NEXT_PUBLIC_MAPS_API_KEY="production_public_map_key_if_required"
MAPS_API_SERVER_KEY="production_server_map_key_if_required"
GEOAPIFY_API_KEY="production_geoapify_api_key"

# Scraper
GASWATCH_BASE_URL="https://gaswatchph.com"
SCRAPER_CRON_SECRET="production_random_secret"
SCRAPER_ENABLED="true"
SCRAPER_RATE_LIMIT_MS="3000"

# Consensus Engine
MIN_UNIQUE_REPORTERS="4"
DEFAULT_PRICE_TOLERANCE_PHP="0.50"
STRICT_PRICE_TOLERANCE_PHP="0.10"
REPORT_FRESHNESS_HOURS="24"
MAX_REASONABLE_PRICE_DELTA_FROM_BASELINE="10.00"

# Admin Seed
SEED_ADMIN_EMAIL="admin@example.com"
```

---

### 20.3 `.gitignore` Requirements

```gitignore
# environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# secrets
secrets.json
*.pem
*.key

# dependencies
node_modules/

# build outputs
.next/
out/
dist/
.vercel/
.netlify/

# firebase local files
.firebase/
firebase-debug.log*

# logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
```

---

## 21. Installation Plan

### 21.1 Core Dependencies

```bash
npm install @prisma/client firebase firebase-admin zod axios cheerio
npm install maps-api
npm install @geoapify/route-directions
npm install autocosts
```

### 21.2 Dev Dependencies

```bash
npm install -D prisma firebase-tools tsx eslint prettier
```

### 21.3 Database and Auth Setup Commands

```bash
npx prisma init
npx prisma generate
npx prisma db push

firebase login
firebase projects:list
firebase use --add
firebase emulators:start
```

Use `prisma db push` for schema synchronization because Prisma's relational migration workflow does not apply to MongoDB.

---

## 22. Suggested File Architecture

```text
src/
  app/
    (public)/
      page.tsx
      map/page.tsx
      stations/page.tsx
      stations/[slug]/page.tsx
      prices/[province]/[city]/page.tsx
      brands/[brand]/page.tsx
      route-cost/page.tsx
    (auth)/
      login/page.tsx
    dashboard/
      page.tsx
      reports/page.tsx
      vehicles/page.tsx
      saved-stations/page.tsx
    admin/
      page.tsx
      stations/page.tsx
      reports/page.tsx
      prices/page.tsx
      scraper/page.tsx
      users/page.tsx
      audit-logs/page.tsx
    api/
      auth/session/route.ts
      auth/logout/route.ts
      stations/route.ts
      stations/[id]/route.ts
      fuel-prices/route.ts
      reports/route.ts
      reports/me/route.ts
      vehicles/route.ts
      vehicles/[id]/route.ts
      route-cost/route.ts
      admin/
        reports/pending/route.ts
        reports/[id]/approve/route.ts
        reports/[id]/reject/route.ts
        stations/route.ts
        stations/[id]/route.ts
        prices/override/route.ts
        scraper/run/route.ts
        scraper/batches/route.ts
        audit-logs/route.ts

  components/
    map/
      GasStationMap.tsx
      StationMarker.tsx
      StationPopup.tsx
      MapFilters.tsx
    stations/
      StationCard.tsx
      StationPriceTable.tsx
      StationSearch.tsx
    reports/
      PriceReportForm.tsx
      ReportStatusBadge.tsx
    route-cost/
      RouteCostCalculator.tsx
      VehicleSelector.tsx
      RecommendationCard.tsx
    admin/
      AdminShell.tsx
      PendingReportsTable.tsx
      StationEditor.tsx
      PriceOverrideForm.tsx
    ui/
      button.tsx
      input.tsx
      dialog.tsx
      table.tsx

  lib/
    auth/
      session.ts
      guards.ts
    db/
      prisma.ts
    firebase/
      client.ts
    firebase-admin/
      index.ts
      auth.ts
    maps/
      mapProvider.ts
      mapsApiAdapter.ts
    geoapify/
      routingClient.ts
      routeCache.ts
    scraper/
      gaswatchClient.ts
      parser.ts
      normalizer.ts
      stationMatcher.ts
    consensus/
      consensusEngine.ts
      clustering.ts
      confidence.ts
    vehicle/
      presets.ts
      costCalculator.ts
      autocostsAdapter.ts
    validations/
      stationSchemas.ts
      reportSchemas.ts
      vehicleSchemas.ts
    utils/
      money.ts
      dates.ts
      geo.ts

  prisma/
    schema.prisma
```

---

## 23. Implementation Phases

## Phase 0 — Codebase Audit and Setup

### Objectives

- Understand current CodeKada system state.
- Identify existing features and missing modules.
- Prepare project for database, auth, maps, and deployment.

### Tasks

- Audit existing folder structure.
- Identify current framework version.
- Identify current database usage.
- Identify current Firebase usage for Auth and Admin SDK if auth is retained.
- Identify existing login/logout implementation.
- Identify existing map implementation.
- Check current environment variable handling.
- Check current deployment configuration.
- Create `.env.local`, `.env.example`, and `.gitignore` updates.
- Configure MongoDB connection string and initialize Prisma.
- Configure Firebase project, web app, and admin credentials if auth is retained.
- Verify Prisma connectivity and Prisma Client generation.

### Deliverables

- `SYSTEM_AUDIT.md`
- Updated `.gitignore`
- Prisma schema initialized
- MongoDB connection verified
- Firebase project configuration documented if auth is retained

### Definition of Done

- App runs locally.
- Prisma can connect to MongoDB and generate a client.
- Environment variables are separated between local and production.

---

## Phase 1 — Data Model and Seed Setup

### Objectives

- Build the core backend data foundation.
- Seed regions, provinces, cities, brands, and fuel types.

### Tasks

- Define Prisma models and embedded document shapes.
- Seed Metro Manila and CALABARZON geography.
- Seed common station brands.
- Seed fuel types.
- Seed vehicle displacement presets.
- Create admin seed user and custom-claim assignment flow.

### Deliverables

- Prisma MongoDB schema draft
- Seed/import script or admin utility
- Seeded backend data
- Admin role assignment logic

### Definition of Done

- MongoDB contains supported regions, provinces, cities, brands, and fuel types.
- Prisma queries return seeded data correctly.

---

## Phase 2 — Authentication and Roles

### Objectives

- Implement login/logout and Google OAuth.
- Protect user, admin, and supervisor routes.

### Tasks

- Configure Firebase Authentication.
- Enable Google provider.
- Configure Firebase Admin session verification and session cookies.
- Add user role field.
- Add route guards.
- Add middleware/proxy route protection depending on Next.js version.
- Create login page.
- Create logout action.
- Create dashboard shell.

### Deliverables

- Google OAuth login
- Logout flow
- Protected `/dashboard`
- Protected `/admin`
- Role-based checks

### Definition of Done

- Users can sign in with Google.
- Users can sign out.
- Only admins/supervisors can access admin screens.

---

## Phase 3 — Station and Price Core

### Objectives

- Build station browsing and price display.

### Tasks

- Create station API.
- Create station list page.
- Create station detail page.
- Create station price table.
- Implement filters.
- Display source labels.
- Display no-data status.

### Deliverables

- `/stations`
- `/stations/[slug]`
- `/api/stations`
- `/api/fuel-prices`

### Definition of Done

- Users can browse stations by city, brand, and fuel type.
- Prices display source and freshness.
- No-data stations are clearly shown.

---

## Phase 4 — GasWatchPH Scraper Pipeline

### Objectives

- Build initial data ingestion from GasWatchPH.

### Tasks

- Build HTTP fetch client.
- Build HTML parser.
- Build raw scrape collection insert.
- Build normalizer.
- Build station matcher.
- Build unmatched station queue.
- Add scraper admin trigger.
- Add scraper audit logs.

### Deliverables

- `gaswatchClient.ts`
- `parser.ts`
- `normalizer.ts`
- `stationMatcher.ts`
- `/api/admin/scraper/run`
- `/admin/scraper`

### Definition of Done

- Scraper can fetch configured pages.
- Raw scraped records are stored.
- Normalized records update scraped baseline prices.
- Unmatched stations do not pollute the active station collection.

---

## Phase 5 — Community Price Reporting

### Objectives

- Allow authenticated users to report station prices.

### Tasks

- Create price report form.
- Validate price input with Zod.
- Prevent duplicate same-user spam within time window.
- Store pending reports.
- Add user report history page.
- Add admin pending reports page.

### Deliverables

- `/api/reports`
- `/dashboard/reports`
- `/admin/reports`
- `PriceReportForm.tsx`

### Definition of Done

- Authenticated users can submit price reports.
- Reports are pending by default.
- Users can see their report status.
- Admins can inspect pending reports.

---

## Phase 6 — Consensus Engine

### Objectives

- Implement 4-user validation handshake and statistical confirmation.

### Tasks

- Implement report grouping.
- Implement clustering algorithm.
- Implement median/mean consensus option.
- Implement confidence score.
- Implement outlier marking.
- Implement expiry logic.
- Implement admin review fallback.
- Update active station price when confirmed.

### Deliverables

- `consensusEngine.ts`
- `clustering.ts`
- `confidence.ts`
- Scheduled consensus job
- Consensus audit trail

### Definition of Done

- 4 matching unique-user reports confirm a price.
- Outliers are rejected or flagged.
- Active station price updates only after valid consensus.
- Confidence score is visible.

---

## Phase 7 — Map Integration

### Objectives

- Display all stations geographically.

### Tasks

- Install and test `maps-api`.
- Build `MapProvider` abstraction.
- Render station markers.
- Add filters.
- Add marker popup.
- Add no-data marker style.
- Add station report action from popup.
- Add price-level coloring.

### Deliverables

- `/map`
- `GasStationMap.tsx`
- `MapProvider`
- `StationMarker`
- `StationPopup`

### Definition of Done

- Users can view supported stations on the map.
- Markers reflect selected fuel type and price status.
- Users can open station detail/report flow from map.

---

## Phase 8 — Geoapify Routing and Cost Efficiency

### Objectives

- Let users calculate whether driving to a station is worth it.

### Tasks

- Create Geoapify routing client.
- Add route request validation.
- Add route cache.
- Create route-cost API.
- Create route-cost UI.
- Compute distance, fuel used, trip cost, savings, and recommendation.

### Deliverables

- `/route-cost`
- `/api/route-cost`
- `routingClient.ts`
- `costCalculator.ts`
- `RecommendationCard.tsx`

### Definition of Done

- User can select station, fuel type, vehicle, and fill liters.
- System returns distance, duration, trip cost, savings, and recommendation.

---

## Phase 9 — Vehicle Profiles and Displacement Presets

### Objectives

- Support vehicle-based cost estimation.

### Tasks

- Add vehicle profile CRUD.
- Seed displacement presets.
- Add custom km/L override.
- Add default vehicle selection.
- Add admin-editable preset values.
- Add `autocosts` adapter or internal formula module.

### Deliverables

- `/dashboard/vehicles`
- `/api/vehicles`
- `VehicleProfile` model
- `VehicleEfficiencyPreset` model
- `costCalculator.ts`

### Definition of Done

- Users can save vehicles.
- Users can choose displacement.
- Users can override actual km/L.
- Route calculator uses saved vehicle settings.

---

## Phase 10 — Admin and Supervisor Controls

### Objectives

- Give authorized staff control over station data and moderation.

### Tasks

- Station CRUD.
- Price override form.
- Pending report review.
- User trust score adjustment.
- Ban/report abuse workflow.
- Scraper job dashboard.
- Audit log viewer.

### Deliverables

- `/admin/stations`
- `/admin/prices`
- `/admin/reports`
- `/admin/users`
- `/admin/audit-logs`

### Definition of Done

- Admins can correct wrong station data.
- Supervisors can review suspicious reports.
- Every manual change creates an audit log.

---

## Phase 11 — Vercel Deployment

### Objectives

- Deploy the system to Vercel with production environment variables while preserving Netlify fallback parity.

### Tasks

- Import the Git repository into Vercel.
- Confirm the detected framework preset is Next.js.
- Add `DATABASE_URL` and app environment variables in Vercel.
- Add Firebase auth variables only if Firebase Auth is retained.
- Configure Firebase authorized domains for Vercel if Firebase Auth is retained.
- Verify MongoDB connectivity and Prisma runtime access from Vercel.
- Test production login.
- Test server-side API routes.
- Test scraper trigger.
- Test route-cost feature.
- Record the same required env vars and domain settings for future Netlify parity.

### Suggested Vercel Project Settings

```text
Framework preset: Next.js
Install command: npm install
Build command: npm run build
Output setting: Auto-detected by Vercel
```

Vercel should detect the Next.js app automatically. Keep `NEXT_PUBLIC_APP_URL` set to the production custom domain when one exists, even though Vercel system environment variables can supply deployment URLs for preview and fallback cases.

### Backend Configuration Command

```bash
npx prisma generate
npx prisma db push
```

Run Prisma schema synchronization separately from the Vercel build so application deploys and database-shape changes can be managed independently. Mirror the same practice in Netlify if you use the fallback host later.

---

## 24. Security Plan

### 24.1 Authentication Security

- Require auth for reporting prices.
- Require role checks for admin/supervisor APIs.
- Never expose database credentials to the client.
- Never expose server-only API keys to the client.
- Use secure cookies in production.

### 24.2 Report Abuse Prevention

- One active pending report per user per station/fuel type within cooldown window.
- Rate-limit report submissions.
- Track report accuracy over time.
- Lower trust score for repeated outliers.
- Ban abusive accounts.
- Add optional proof image later.

### 24.3 Scraper Safety

- Use low-frequency scheduled scraping.
- Store source URL and timestamp.
- Add request timeout and retry limit.
- Do not hammer source pages.
- Allow disabling scraper with `SCRAPER_ENABLED=false`.

### 24.4 API Security

- Validate all API inputs with Zod.
- Use server-side authorization checks.
- Add rate limiting to sensitive routes.
- Log admin actions.
- Use CSRF-safe auth flow.

---

## 25. Testing Strategy

### 25.1 Unit Tests

Test:

- Price clustering
- Consensus calculation
- Outlier detection
- Vehicle cost formula
- Route-cost calculation
- Fuel type normalization
- Station matching

### 25.2 Integration Tests

Test:

- Report submission to consensus flow
- Scrape batch to station price update
- Authenticated report route
- Admin price override
- Geoapify route response handling

### 25.3 End-to-End Tests

Test user flows:

1. User logs in with Google.
2. User finds a station on map.
3. User reports price.
4. Four users report matching values.
5. Price becomes community confirmed.
6. User calculates route cost.
7. Admin overrides a wrong price.

---

## 26. Performance Plan

### 26.1 Database Performance

Add indexes on:

- Station city
- Station brand
- Station coordinates
- Price report station/fuel/status
- Scrape batch timestamps
- Route cache origin/station

### 26.2 Frontend Performance

- Paginate station tables.
- Cluster map markers.
- Use server-side filtering for large station lists.
- Lazy-load map module.
- Cache route results.
- Avoid fetching all station details for every marker.

### 26.3 API Performance

- Cache public station lists by filter.
- Cache city/brand/fuel metadata.
- Cache Geoapify route results by rounded origin and station.
- Use batch updates during scraping.

---

## 27. UI/UX Requirements

### 27.1 Price Display Labels

Examples:

```text
₱79.60/L · Community verified · Updated 2h ago
₱80.20/L · Scraped baseline · Updated Apr 29, 2026
No data · Be the first to report
₱78.90/L · Admin verified · Updated by supervisor
```

### 27.2 Confidence Display

| Confidence | Label | Meaning |
|---|---|---|
| 90–100 | Very high | Strong agreement among reports |
| 75–89 | High | Good agreement |
| 50–74 | Medium | Usable but still watch carefully |
| 25–49 | Low | Needs more reports |
| 0–24 | No confidence | No data or stale data |

### 27.3 Report Form Messaging

After submission:

```text
Your report has been submitted. It will become confirmed once at least 4 nearby reports match within the validation threshold.
```

If still pending:

```text
Pending validation: 2 of 4 matching reports received.
```

If rejected:

```text
Your report did not match the confirmed price cluster. It has been marked as an outlier.
```

---

## 28. Admin Override Rules

Admin/supervisor override should:

- Require reason.
- Require actor user ID.
- Store old price and new price.
- Create audit log.
- Display as `Admin verified`.
- Override scraped and community prices until removed or expired.

Recommended override fields:

| Field | Description |
|---|---|
| Station | Target station |
| Fuel type | Target fuel type |
| New price | PHP per liter |
| Reason | Required explanation |
| Expiration | Optional |
| Supervisor/admin ID | Auto-filled |

---

## 29. Analytics and Monitoring

Track:

- Number of stations covered.
- Number of stations with no data.
- Number of reports per day.
- Confirmation success rate.
- Outlier rate.
- Most reported cities.
- Most searched areas.
- Average price by fuel type.
- Scraper failure rate.
- Geoapify API usage.
- User retention.

---

## 30. Deployment Checklist

### Before Deployment

- [ ] `.env.local` created locally.
- [ ] `.env` with secrets not committed.
- [ ] `.gitignore` protects secrets.
- [ ] MongoDB cluster or database is configured.
- [ ] Prisma schema is finalized and pushed.
- [ ] Firebase Auth authorized domains are configured if Firebase Auth is retained.
- [ ] Geoapify key is created.
- [ ] Vercel environment variables are added.
- [ ] Netlify fallback environment variable mapping is documented.
- [ ] Admin email is seeded.
- [ ] Scraper can be disabled through env variable.
- [ ] Build passes locally.

### After Deployment

- [ ] Vercel build succeeds.
- [ ] MongoDB-backed Prisma data access is reachable.
- [ ] Login works.
- [ ] Logout works.
- [ ] Station list loads.
- [ ] Map loads.
- [ ] Price report submission works.
- [ ] Admin dashboard is protected.
- [ ] Route cost calculation works.
- [ ] Scraper route is protected by secret.

---

## 31. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Scraped data changes format | Scraper breaks | Store raw data, add parser tests, admin fallback |
| Source blocks scraper | No initial updates | Rate limit, cache, manual admin import, look for official data |
| Fake user reports | Wrong prices | 4-user consensus, trust scores, rate limits |
| Sparse reports outside Metro Manila | Prices stay stale | Show no-data/stale labels, prioritize rollout by city |
| Geoapify quota limits | Route feature fails | Cache route results, limit anonymous usage |
| Displacement estimates inaccurate | Bad trip recommendations | Let users override actual km/L |
| OAuth misconfiguration | Login fails | Maintain environment checklist and Firebase authorized-domain checklist |
| Serverless function limits on Vercel or Netlify | Scraper may timeout | Use scheduled jobs, split scraping by city, consider external worker later |

---

## 32. Minimum Viable Product Definition

The MVP is complete when:

- Users can log in with Google.
- Users can view stations in Metro Manila and at least part of CALABARZON.
- Stations display fuel prices or no-data state.
- Scraped baseline prices can be imported.
- Users can submit price reports.
- 4-user validation confirms a community price.
- Admins can override station prices.
- Users can calculate route cost to a station.
- Users can create a vehicle profile with displacement and km/L.
- App is deployed on Vercel with Prisma-backed MongoDB data storage, and the Netlify fallback path is still documented.

---

## 33. Recommended First Sprint Backlog

### Sprint 1 — Foundation

- [ ] Configure MongoDB database and Prisma connection.
- [ ] Define Prisma MongoDB schema.
- [ ] Add `.env.local` and `.env.example`.
- [ ] Seed geography, brands, fuel types, vehicle presets.
- [ ] Add Google OAuth login/logout via Firebase Auth.
- [ ] Add roles and custom claims.

### Sprint 2 — Station Browsing

- [ ] Build station API.
- [ ] Build station list.
- [ ] Build station detail page.
- [ ] Add filters.
- [ ] Add active fuel price table.

### Sprint 3 — Scraper Baseline

- [ ] Build GasWatchPH fetcher.
- [ ] Build parser.
- [ ] Build normalization.
- [ ] Store raw scrape batch.
- [ ] Update scraped baseline prices.

### Sprint 4 — Community Reports

- [ ] Build report form.
- [ ] Build report API.
- [ ] Build pending status.
- [ ] Build admin report view.

### Sprint 5 — Consensus Engine

- [ ] Build clustering.
- [ ] Build 4-user validation.
- [ ] Build confidence scoring.
- [ ] Update active prices from consensus.

### Sprint 6 — Map and Routing

- [ ] Build map page.
- [ ] Render markers.
- [ ] Add Geoapify route client.
- [ ] Add route-cost calculator.

### Sprint 7 — Deployment and Hardening

- [ ] Configure Vercel.
- [ ] Add production env variables in Vercel.
- [ ] Configure Firebase authorized domains and admin credentials for Vercel.
- [ ] Run `prisma generate` and `prisma db push` for production schema updates.
- [ ] Test Google sign-in on Vercel.
- [ ] Document Netlify fallback environment parity.
- [ ] Add rate limits.
- [ ] Add scraper safety controls.

---

## 34. Final Recommended Implementation Order

1. Prisma MongoDB data model
2. Auth and roles
3. Station data and fuel types
4. Scraper staging
5. Station browsing UI
6. User price reports
7. Consensus engine
8. Admin override tools
9. Map display
10. Route cost calculator
11. Vehicle displacement profiles
12. Vercel deployment
13. Monitoring and testing

---

## 35. Notes for Developers

- Do not hardcode secrets.
- Do not expose server API keys to the browser unless they are meant to be public keys.
- Do not let scraped prices overwrite community-confirmed or admin-verified prices by default.
- Do not accept unauthenticated price reports for MVP.
- Do not rely only on engine displacement for cost estimates.
- Do not assume all gas stations have complete public data.
- Always display price source and freshness.
- Always log admin/supervisor changes.

---

## 36. External References Used for Planning

- GasWatchPH: `https://gaswatchph.com/`
- maps-api npm package: `https://www.npmjs.com/package/maps-api`
- Geoapify Routing API documentation: `https://apidocs.geoapify.com/docs/routing/`
- Geoapify route directions npm package: `https://www.npmjs.com/package/@geoapify/route-directions`
- autocosts npm package: `https://www.npmjs.com/package/autocosts`
- Vercel environment variables documentation: `https://vercel.com/docs/environment-variables`
- Vercel Next.js deployment guide: `https://vercel.com/docs/frameworks/nextjs`
- Netlify environment variables documentation: `https://docs.netlify.com/build/configure-builds/environment-variables/`
- Netlify Next.js deployment guide: `https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/`
- Prisma MongoDB connector documentation: `https://www.prisma.io/docs/orm/overview/databases/mongodb`
- MongoDB data-modeling introduction: `https://www.mongodb.com/docs/manual/core/data-model-design/`
- Firebase Authentication documentation: `https://firebase.google.com/docs/auth`
- Firebase Admin SDK documentation: `https://firebase.google.com/docs/admin/setup`

---

# End of Plan
