# GasTrackPH

**Live site:** [https://your-url-here]()

A community-powered fuel price tracking app for the Philippines — focused on Metro Manila and CALABARZON. Users find nearby gas stations on an interactive map, submit real-time fuel prices, and confirm each other's reports before they go live. A built-in route planner answers the key question: _"Is it actually worth driving to that cheaper station?"_

---

## What it does

| Feature | Description |
|---|---|
| Interactive map | Locate gas stations by GPS; Leaflet.js with marker clustering |
| Crowd-validated prices | Submitted prices require 3 independent confirmations before going live |
| Route planner | Calculates whether a detour to a cheaper station actually saves money given your vehicle's fuel consumption |
| AI station recommendation | Context-aware station suggestions |
| Role-based dashboards | Separate views for users, moderators, and admins |
| Push notifications | FCM price alerts |
| PWA | Installable on mobile, offline-capable |
| Automated price seeding | Scheduled Cloud Function scrapes GasWatchPH as a live baseline |

---

## Tech Stack

| Concern | Technology |
|---|---|
| Framework | Next.js 16.2.4 — App Router |
| UI | React 19.2.4, Tailwind CSS v4 |
| Language | TypeScript 5 (strict) |
| Database | Firestore (Firestore-only — no SQL) |
| Auth | Firebase Auth (Google OAuth) + server-side session cookies |
| Validation | Zod v4 |
| Client data | TanStack Query v5 |
| Mapping | Leaflet.js + leaflet.markercluster |
| Routing API | Geoapify |
| Background jobs | Firebase Cloud Functions v5 (Node 20) |
| Push notifications | Firebase Cloud Messaging |

---

## How it works

### Community validation consensus

Prices don't go live immediately. A submission sits in `priceReports` and accumulates confirm/reject/flag votes from other users. When the confirmation threshold is met, a Firestore trigger automatically promotes the price to live and updates the station's denormalized `lowestPrice` field.

### Route planner

Given an origin, destination, vehicle fuel consumption, and current prices — the app calls the Geoapify routing API to calculate detour distance, time cost, and fuel savings. It tells you whether the cheaper station is actually worth the drive.

### Auth & roles

Four role levels: `user` → `moderator` → `admin` → `superadmin`. Next.js App Router route groups enforce boundaries at the layout level — no ad-hoc guard logic scattered through pages.

### Data layer

All server-side reads and writes go through `lib/firebase-admin/queries.ts`. All mutations go through Server Actions in `app/_actions/` — validated with Zod, guarded with `requireAuth()`/`requireRole()`, returning discriminated unions instead of throwing.

---

## Project structure

```
app/
  _actions/              # Server Actions — all mutations
  (marketing)/           # Public landing page
  (auth)/                # Login / register
  (app)/                 # Authenticated user routes (map, route planner, validation queue)
  (protected-admin)/     # Admin dashboard — station CRUD, user management, config
  (protected-moderator)/ # Moderator review queue
  api/                   # REST Route Handlers (auth, AI, prices, notifications, webhooks)

components/              # Shared UI — map, validation voting, route planner, PWA prompts
hooks/                   # use-stations, use-route-calculation, use-validation-votes, …
lib/
  firebase-admin/        # Server-side Firestore CRUD (queries.ts) + Admin SDK
  firebase/              # Client-side Firebase (auth, real-time subscriptions, FCM)
  auth/                  # requireAuth(), requireRole() guards
  utils/                 # format, geo (Haversine), Zod validators
functions/               # Firebase Cloud Functions — price scraping + Firestore triggers
types/                   # Shared TypeScript types
```

