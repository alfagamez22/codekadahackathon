# Dynamic Path-Based Gas Station Smart Optimizer Update
## Summary
This update introduces a fully dynamic, path-based optimization model that replaces the previous static route behavior coefficient ($R$). The system now evaluates the marginal cost of choosing a gas station based on the user's actual travel intent: dedicated trips, one-way destination travel, or round-trip turnovers.

## Added
### 1. Path-Based Deviation Model
Implemented in `app/(app)/stations/nearby/page.tsx`:
- Replaced static $R$ multiplier with dynamic $\Delta D$ (marginal distance) and $\Delta T$ (marginal time) calculations.
- Supported Scenarios:
  - **Scenario A: Roundabout (Refuel & Return Home):** Calculates the cost of a dedicated round-trip ($2 \times D_{station}$).
  - **Scenario B: One-Way (Refuel on the way):** Calculates the detour cost relative to the direct route to a destination ($(D_{origin \to station} + D_{station \to dest}) - D_{origin \to dest}$).
  - **Scenario C: Turnover (Destination & Return):** Evaluates the total trip cycle including the return path home.
- Dynamic Objective Function ($J_i$):
  $J_i = (F \cdot P_i) + (\Delta D_i \cdot C \cdot P_{ref}) + (\Delta T_i \cdot V_t)$
- Net Savings Display:
  $Net Savings = [F \cdot (P_{ref} - P_i)] - [(\Delta D_i \cdot C \cdot P_{ref}) + (\Delta T_i \cdot V_t)]$

### 2. Multi-Unit Fuel Consumption Support
- Users can now input fuel consumption in `km/L`, `L/100km`, or `L/km`.
- Internal logic automatically normalizes all inputs to standard $L/km$ for objective scoring.

### 3. Dynamic Reference Pricing ($P_{ref}$)
- The baseline reference price is now dynamically computed as the average of available nearby stations, providing a more localized savings estimate.

### 4. Interactive Destination Mapping (Mock)
- Added coordinate-based destination and home inputs to facilitate path-based calculations in Scenarios B and C.

## Modified
### 1. Sidebar UI Refactoring
- Updated the "Smart Station Optimizer" panel with a "Travel Purpose" selector.
- Added a unit selector for fuel consumption.
- Updated result cards to show marginal distance ($\Delta D$) and marginal time ($\Delta T$).
- Added visual warnings when a "cheap" station's detour cost outweighs its fuel price savings.

---

# Previous Update: Nearby Stations & Smart Optimizer
## Summary
This document highlights the previous implementation work for Nearby Stations, map behavior, and the initial automated best-station decision model.

## Added

### 1. Automated station optimization model (replaces chat recommendation flow)
Implemented in `app/(app)/stations/nearby/page.tsx`:
- Added a variable-based objective function to rank nearby stations automatically.
- Added optimizer inputs for:
  - Fuel type
  - Fuel amount to fill (`F`)
  - Fuel consumption (`C`)
  - Time value (`V_t`)
  - Route behavior coefficient (`R`)
- Added automatic best-station detection and map highlight.
- Added net savings display versus the next-best option.
- Added objective formula display in UI.

Objective function used:

`J_i = (F * P_i) + (D_i * R * C * P_curr) + (T_i * R * V_t)`

Where:
- `P_i`: station fuel price
- `D_i`: distance to station
- `T_i`: ETA
- `P_curr`: reference/current path fuel price
- `R`: route type coefficient (0 pass-through, 1 detour, 2 dedicated trip)

### 2. Brand-based map marker styling and best-station visual emphasis
Implemented in `components/stations/station-map.tsx`:
- Added brand style mapping aligned with Feature2 brand palette/labels.
- Marker label + color now follows known station brand keys.
- Added highlighted station rendering (border/scale) for optimizer winner.

### 3. User heading cone and improved user-location map visuals
Implemented in `components/stations/station-map.tsx` + `hooks/use-geolocation.ts`:
- Added Google-like blue user marker.
- Added soft accuracy circle around user position.
- Added Field-of-View (FOV) cone polygon using heading.
- Added dynamic location tracking support using geolocation watch updates.
- Added heading fallback from device orientation events.

## Modified

### 1. Nearby station plotting/radius behavior
Modified in `app/(app)/stations/nearby/page.tsx`:
- Nearby map now uses strict 5km logic from active user coordinates.
- Plotting includes all stations within the 5km radius.
- ETA computation now runs for all plotted stations inside 5km.

### 2. Geoapify usage and ETA stability
Modified in `app/(app)/stations/nearby/page.tsx`:
- Uses `NEXT_PUBLIC_GEOAPIFY_API_KEY` with safe guard if missing.
- ETA update logic remains stabilized (prevents unnecessary state churn).

### 3. Map component API enhancements
Modified in `components/stations/station-map.tsx`:
- New props added:
  - `userHeading?: number | null`
  - `highlightStationId?: string | null`
- Existing behavior retained for station rendering, popups, and clustering.

## Files Changed
- `app/(app)/stations/nearby/page.tsx`
- `components/stations/station-map.tsx`
- `hooks/use-geolocation.ts`

## Data/Env Notes
- Pricing source remains from GasWatch script endpoint (`GASWATCHPH_DATA_URL`).
- ETA/routing uses Geoapify (`NEXT_PUBLIC_GEOAPIFY_API_KEY`).

## Current Git State
These updates were prepared locally in the working tree and can be committed when ready.

## Update: Dynamic Scenario Math + Feature2 Marker Source Alignment

### What Was Added
- Scenario-aware candidate selection:
  - `ROUNDABOUT`: stations within 5km of origin.
  - `ONE_WAY`: stations inside a route corridor around origin→destination.
  - `TURNOVER`: stations inside outbound or inbound corridor for full trip cycle.
- Stop insertion mode for turnover:
  - `AUTO`, `OUTBOUND_STOP`, `INBOUND_STOP`.
  - `AUTO` selects the lower-detour option.
- Dynamic turnover calculations:
  - Compares marginal distance/time for outbound-stop vs inbound-stop and picks the configured mode.
- Feasibility checks:
  - Pre-refuel reachability using `currentFuel - reserveFuel`.
  - Tank-capacity guard for target fill.
  - Post-refuel sufficiency check for remaining trip + reserve.

### Feature2 / Marker-Key Alignment Fix
- Removed marker-style drift risk by sourcing brand marker metadata from GasWatch payload (`BRANDS`) instead of relying only on static map constants.
- `StationMap` now accepts external `brandStyles` and merges them with local fallbacks.
- Nearby page passes parsed brand metadata from `/api/gaswatchph/stations` to the map renderer.

### Files Updated In This Pass
- `lib/gaswatchph.ts`
- `app/api/gaswatchph/stations/route.ts`
- `components/stations/station-map.tsx`
- `app/(app)/stations/nearby/page.tsx`
