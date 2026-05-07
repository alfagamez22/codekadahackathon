<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Agent Guidelines

## Stack

| Concern | Approach |
|---|---|
| Framework | Next.js 16.2.4 — App Router; consult `node_modules/next/dist/docs/` |
| React | 19.2.4 |
| Language | TypeScript 5, strict mode |
| Styling | Tailwind CSS v4 via PostCSS (no `tailwind.config.*` — config lives in CSS) |
| Validation | Zod v4 |
| Client data | TanStack Query v5 (`useQuery`, `useMutation`) |
| Server data | Server Actions + `lib/firebase-admin/queries.ts` |
| Auth | Firebase Auth (client) + Firebase Admin SDK (server session cookies) |
| Database | **Firestore only** — see warning below |
| Cloud functions | Separate `functions/` package (CommonJS, Node 20, Firebase Functions v5) |

---

## ⚠️ Firestore Only — No Postgres

All data access goes through:
- **`lib/firebase-admin/queries.ts`** — all server-side CRUD (stations, prices, users, analytics)
- **`lib/firebase-admin/firestore.ts`** — `adminDb` instance + `getSystemConfig()`
- **`lib/firebase/firestore.ts`** — client-side real-time subscriptions

`lib/db/` is **dead legacy code** — do not import from it. `lib/firebase-admin/sql-mirror.ts` is also dead. If you find imports from either, replace them with equivalents from `lib/firebase-admin/queries.ts`.

### Firestore Collections

| Collection | Purpose |
|---|---|
| `users` | User profiles and roles |
| `stations` | Gas station data (includes `lowestPrice`, `lowestFuelType` denormalized fields) |
| `fuelPrices` | Current price per station+fuelType (doc ID: `{stationId}_{fuelType}`) |
| `priceHistory` | Append-only price change log |
| `priceReports` | Crowdsourced price submissions |
| `priceReports/{id}/votes` | Confirm/reject/flag votes subcollection |
| `auditLogs` | Admin action history |
| `systemConfig` | App-wide thresholds and cooldowns |
| `pushTokens` | FCM device tokens |

---

## Commands

```bash
npm run dev          # Next.js dev server (Turbopack)
npm run build        # Type-check + production build
npm run lint         # ESLint flat config (eslint-config-next)
npm run firebase:seed         # Seed Firestore with sample data
npm run firebase:bootstrap    # Deploy Firestore rules + seed
```

**No tests exist.** Do not create test files unless explicitly asked.

---

## Required Environment Variables (`.env.local`)

```
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="..."
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="..."
FIREBASE_ADMIN_PROJECT_ID="..."
FIREBASE_ADMIN_CLIENT_EMAIL="..."
FIREBASE_ADMIN_PRIVATE_KEY="..."
```

Do not add `POSTGRES_URL` — Postgres is not used.

---

## Project Structure

```
app/
  _actions/            # Server Actions ('use server')
  (app)/               # Authenticated routes
  (auth)/              # Login / register
  (marketing)/         # Public pages
  (protected-admin)/   # Admin-only routes
  (protected-moderator)/
  api/                 # Route Handlers
components/            # Shared UI components
hooks/                 # use-*.ts custom hooks
lib/
  auth/                # guards.ts (requireAuth, requireRole), session.ts
  db/                  # ⚠️ DEAD — do not use
  firebase/            # Client SDK (auth, firestore, messaging)
  firebase-admin/
    queries.ts         # ← all server-side Firestore CRUD lives here
    firestore.ts       # adminDb instance + getSystemConfig
    auth.ts            # verifyIdToken, setUserRole, createSessionCookie
    sql-mirror.ts      # ⚠️ DEAD — do not use
  utils/               # format.ts, geo.ts, validators.ts
src/features/          # Feature-slice modules (gas-prices, osm-stations)
types/                 # Shared TS types
functions/             # Firebase Cloud Functions (separate npm workspace)
```

---

## Code Style

**TypeScript:** strict mode, no `any`, no `@ts-ignore` without justification. Prefer `type` over `interface`. Infer types from Zod: `export type Foo = z.infer<typeof fooSchema>`. Use `@/` alias for all non-relative imports.

**Imports order:** React/Next.js → third-party → `@/lib`, `@/hooks`, `@/types` → relative → `import type` last.

**Server vs client:** Default to Server Components. Add `'use client'` only when hooks or browser APIs are needed. Add `'use server'` at the top of every action file. Add `import 'server-only'` in server utilities. **Never set cookies from a Server Component** — only from Server Actions or Route Handlers.

**Server Actions** return a discriminated union — never throw to the caller:
```ts
return { success: true, stationId: id }   // ✓
return { error: 'Validation failed' }      // ✓
throw new Error('...')                     // ✗
```
Validate with Zod `.safeParse()` and guard with `requireAuth()` / `requireRole([...])` at the top.

**API Routes:** `NextResponse.json({ error }, { status })` for errors. Validate body with Zod before any DB access.

**Client fetching:** TanStack Query v5 — always check `res.ok`, throw on failure so the query captures the error.

**Styling:** Tailwind utility classes only. No inline styles. No `tailwind.config.ts`.

**Validation:** All external input through Zod. Use `.safeParse()`, not `.parse()`, in actions and route handlers.

---

## Naming Conventions

| Thing | Convention |
|---|---|
| Files / dirs | `kebab-case` |
| React components | `PascalCase` |
| Hooks | `useCamelCase` (`hooks/use-*.ts`) |
| Server Actions | `camelCaseAction` (e.g. `createStationAction`) |
| Zod schemas | `camelCaseSchema` (e.g. `stationSchema`) |
| Types | `PascalCase` |
| Constants | `SCREAMING_SNAKE_CASE` |

---

## Auth & Roles

Roles: `user` | `moderator` | `admin` | `superadmin` (from `types/auth.ts`).
`superadmin` passes all role checks implicitly.

```ts
const session = await requireAuth()           // any signed-in user
const session = await requireRole(['admin'])  // admin or superadmin only
```

Auth failures call `redirect()` internally — this is expected, not an error.

---

## Firebase Cloud Functions (`functions/`)

Separate npm workspace. Uses CommonJS (`module: commonjs`).
Build: `npm run build` inside `functions/`. Deploy: `firebase deploy --only functions`.
Scheduled functions scrape gas prices; Firestore triggers handle downstream updates.
