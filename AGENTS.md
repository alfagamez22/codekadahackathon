<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Agent Guidelines

## Stack Overview

| Concern | Approach |
|---|---|
| Framework | Next.js 16.2.4 — App Router, non-standard version; consult `node_modules/next/dist/docs/` |
| React | 19.2.4 |
| Language | TypeScript 5, strict mode |
| Styling | Tailwind CSS v4 via PostCSS plugin (no `tailwind.config.*` — config lives in CSS) |
| Validation | Zod v4 |
| Client data | TanStack Query v5 (`useQuery`, `useMutation`) |
| Server data | Server Actions + Firestore via Firebase Admin SDK |
| Auth | Firebase Auth (client) + Firebase Admin (server session cookies) |
| Database | **Firestore only** — see warning below |
| Cloud functions | Separate `functions/` package (CommonJS, Node 20, Firebase Functions v5) |

---

## ⚠️ Database: Firestore Only — Do Not Use Postgres

The **only database is Firestore**. All data reads and writes must go through:
- `lib/firebase-admin/firestore.ts` — server-side (`adminDb`)
- `lib/firebase/firestore.ts` — client-side real-time subscriptions

`lib/db/` (postgres queries, migrations, schema) is **legacy dead code** that was never cleaned up.
`POSTGRES_URL` is intentionally absent from `.env.local`. **Do not import from `lib/db/` or `@/lib/db`.**
If you encounter imports from `lib/db/` in existing code, treat them as bugs to be replaced with Firestore equivalents.

### Firestore Collections

| Collection | Purpose |
|---|---|
| `users` | User profiles and roles |
| `stations` | Gas station data |
| `fuelPrices` | Current fuel prices per station |
| `priceReports` | Crowdsourced price submissions |
| `priceReports/{id}/votes` | Subcollection of confirm/reject/flag votes |
| `auditLogs` | Admin action history |
| `systemConfig` | App-wide configuration (thresholds, cooldowns) |
| `pushTokens` | FCM device tokens for push notifications |

---

## Commands

```bash
# Development
npm run dev          # Next.js dev server (Turbopack enabled)

# Production
npm run build        # Type-check + build
npm run start        # Serve production build

# Lint
npm run lint         # ESLint (flat config, eslint-config-next)

# Firebase
npm run firebase:seed         # Seed Firestore
npm run firebase:bootstrap    # Deploy Firestore rules + seed
```

**There are no tests.** No test framework is configured. Do not create test files unless explicitly asked.

---

## Required Environment Variables

The `.env.local` for local dev must contain:

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

Do not add `POSTGRES_URL` — Postgres is not part of this project.

---

## Project Structure

```
app/
  _actions/          # Server Actions ('use server') — auth, stations, reports, etc.
  (app)/             # Authenticated route group
  (auth)/            # Login / register
  (marketing)/       # Public landing pages
  (protected-admin)/ # Admin-only routes
  (protected-moderator)/ # Moderator-only routes
  api/               # API Route Handlers
components/          # Shared React components (admin, auth, layout, stations, ui, …)
hooks/               # Custom React hooks (use-*.ts)
lib/
  auth/              # guards.ts, session.ts — requireAuth(), requireRole()
  db/                # ⚠️ LEGACY dead code — do not use
  firebase/          # Client SDK (auth, firestore, messaging)
  firebase-admin/    # Admin SDK (auth, firestore)
  utils/             # format.ts, geo.ts, validators.ts (Zod schemas)
src/features/        # Feature-slice architecture (gas-prices, osm-stations)
types/               # Shared TypeScript types (api.ts, station.ts, report.ts, …)
functions/           # Firebase Cloud Functions (separate npm workspace)
```

---

## Code Style

### TypeScript

- Strict mode is enabled. No `any`, no `@ts-ignore` without justification.
- Prefer `type` over `interface` for object shapes.
- Infer types from Zod schemas: `export type Foo = z.infer<typeof fooSchema>`.
- Export schemas and their inferred types from the same file (`lib/utils/validators.ts`).
- Use the `@/` path alias for all non-relative imports (resolves to repo root).

### Imports

Order (enforced by linter):
1. React / Next.js framework imports
2. Third-party packages
3. Internal `@/lib/*`, `@/hooks/*`, `@/types/*`
4. Local relative imports
5. Type-only imports last (`import type { … }`)

Always use `import type` for pure type imports.

### Server vs. Client Boundaries

- Add `'use server'` at the top of every Server Action file.
- Add `'use client'` at the top of any file that uses React hooks or browser APIs.
- Add `import 'server-only'` in server-only utilities (e.g., `lib/auth/guards.ts`) to prevent accidental client import.
- Server Components are the default. Do not add `'use client'` unless necessary.
- **Never set cookies from a Server Component** — only from Server Actions or Route Handlers.

### Server Actions (`app/_actions/`)

Return a discriminated result object — never throw to the caller:

```ts
// Good
return { success: true, stationId: id }
return { error: 'Validation failed: name is required' }

// Bad — do not throw
throw new Error('...')
```

Validate all inputs with Zod `.safeParse()`. Return the first issue message on failure:

```ts
const parsed = schema.safeParse(input)
if (!parsed.success) return { error: parsed.error.issues[0].message }
```

Always call `requireAuth()` or `requireRole([...])` at the top of protected actions.

### Firestore Access Patterns

Server-side writes and reads use `adminDb` from `lib/firebase-admin/firestore.ts`:

```ts
import { adminDb } from '@/lib/firebase-admin/firestore'
await adminDb.collection('stations').doc(id).set(data)
const snap = await adminDb.collection('users').doc(uid).get()
```

Client-side real-time subscriptions use helpers from `lib/firebase/firestore.ts`.
Use Firestore transactions (`adminDb.runTransaction`) for atomic multi-document updates (e.g., voting).

### API Route Handlers (`app/api/`)

- Use `NextResponse.json({ error: '...' }, { status: 4xx })` for errors.
- Validate request bodies with Zod before any DB access.
- Return consistent JSON shapes.

### Client Data Fetching

Use TanStack Query v5 for all client-side async state:

```ts
useQuery({
  queryKey: ['stations', params],
  queryFn: async () => {
    const res = await fetch(`/api/stations?${qs}`)
    if (!res.ok) throw new Error('Failed to fetch stations')
    return res.json() as Promise<StationListItem[]>
  },
  staleTime: 60_000,
})
```

Always check `res.ok` before parsing JSON. Throw an `Error` on failure so TanStack Query can catch it.

### Naming Conventions

| Thing | Convention |
|---|---|
| Files / directories | `kebab-case` |
| React components | `PascalCase` (file name matches export) |
| Hooks | `useCamelCase` in `hooks/use-*.ts` |
| Server Actions | `camelCaseAction` suffix (e.g., `createStationAction`) |
| Zod schemas | `camelCaseSchema` (e.g., `stationSchema`) |
| Types | `PascalCase` |
| Constants | `SCREAMING_SNAKE_CASE` |

### Error Handling

- Server Actions: return `{ error: string }` — no thrown errors to the caller.
- API routes: `NextResponse.json({ error }, { status })`.
- Client hooks: let TanStack Query capture thrown errors; surface via `isError` / `error`.
- Auth failures in server utilities: call `redirect('/login')` or `redirect('/dashboard')` (Next.js `redirect()` throws internally — this is expected).

### Styling (Tailwind v4)

- Tailwind v4 uses a CSS-first config. No `tailwind.config.ts`.
- Use utility classes directly. Avoid inline styles.
- Component variants live in the component file, not a separate style file.

### Validation

- All external input (form data, API bodies, URL params) must pass through a Zod schema.
- Define schemas in `lib/utils/validators.ts` or co-located feature files.
- Use `.safeParse()` (not `.parse()`) in server actions and API routes so errors can be returned gracefully.

---

## Firebase Cloud Functions (`functions/`)

- Separate npm workspace; run commands from the `functions/` directory.
- Uses **CommonJS** (`module: commonjs` in tsconfig) — use `require`/`module.exports` conventions, or `import`/`export` compiled to CJS.
- Build: `npm run build` inside `functions/`.
- Deploy: `firebase deploy --only functions`.
- Scheduled functions scrape gas prices on a timer; Firestore triggers handle downstream updates.

---

## Auth & Roles

Roles (from `types/auth.ts`): `user`, `moderator`, `admin`, `superadmin`.

```ts
// In any server action or route that requires auth:
const session = await requireAuth()         // any authenticated user
const session = await requireRole(['admin']) // admin or superadmin
```

`superadmin` implicitly passes all role checks.