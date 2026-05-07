# Implementation Plan: Dynamic Path-Based Gas Station Smart Optimizer

## Objective
To replace the existing static Route Behavior Coefficient ($R$) in the nearby stations optimizer with a fully dynamic, path-based calculation. The system will evaluate the actual marginal travel cost (fuel and time) of reaching a gas station based on three distinct real-world user scenarios: Roundabout (A), One-way (B), and Turnover (C).

## Key Files & Context
- `app/(app)/stations/nearby/page.tsx`: The main optimizer page containing state, API calls (Geoapify), objective function scoring, and UI components.
- `docs/nearby-optimizer-update.md`: Documentation outlining the optimizer's capabilities and mathematical models.
- **Context:** The current optimizer uses a fixed multiplier (`R` = 0, 1, or 2) to estimate the penalty for visiting a station. This will be replaced by computing the explicit difference in distance ($\Delta D$) and ETA ($\Delta T$) using routing/distance data.

## Implementation Steps

### Phase 1: State & UI Input Refactoring (`page.tsx`)
1. **Remove Old Variables:** Remove `routeBehavior` state and related UI elements.
2. **Add New Travel Scenarios:**
   - Introduce a new state variable: `travelMode: 'ROUNDABOUT' | 'ONE_WAY' | 'TURNOVER'`.
   - Default to `'ROUNDABOUT'`.
   - Add UI selectors for this travel mode.
3. **Add New Location Inputs:**
   - For `ONE_WAY` and `TURNOVER`, the user needs a destination. Add mock inputs or actual location search fields for `destinationCoords` and `homeCoords`. (For the scope of this hackathon/feature, if full location search is too complex, we will implement placeholder/mock coordinates or simple coordinate inputs to prove the logic).
4. **Fuel Consumption Normalization:**
   - Introduce a selector for fuel consumption unit (`km/L`, `L/100km`, `L/km`).
   - Create a normalization helper that converts the user's input into `L/km` ($C$) for internal calculations.

### Phase 2: Dynamic Objective Function Implementation (`page.tsx`)
1. **Dynamic Reference Price ($P_{ref}$):**
   - Modify the current $P_{curr}$ (simple average of visible stations) to represent $P_{ref}$.
2. **Scenario Logic Integration:** Inside the `useMemo` block that scores stations (`modeledStations`), replace the old formula:
   `objectiveCost = (targetFuelLiters * stationPrice) + travelFuelCost + timeCost`
   with conditional logic based on `travelMode`:
   - **ROUNDABOUT (Scenario A):**
     - $\Delta D_i = 2 \times D_{station}$
     - $\Delta T_i = 2 \times ETA_{station}$
   - **ONE_WAY (Scenario B):**
     - Requires $D_{station\_to\_dest}$ and $D_{origin\_to\_dest}$ (Direct route).
     - $\Delta D_i = (D_{origin\_to\_station} + D_{station\_to\_dest}) - D_{origin\_to\_dest}$
     - Calculate $\Delta T_i$ similarly if routing data allows, otherwise estimate via distance.
   - **TURNOVER (Scenario C):**
     - Requires full trip distances.
     - $\Delta D_i = (D_{origin\_to\_station} + D_{station\_to\_dest} + D_{dest\_to\_home}) - (D_{origin\_to\_dest} + D_{dest\_to\_home})$
3. **Apply Margins:**
   - $J_i = (F \times P_i) + (\Delta D_i \times C \times P_{ref}) + (\Delta T_i \times V_t)$
4. **Net Savings Calculation:**
   - Compute `Net Savings = Gross Savings - Extra Travel Cost`.

### Phase 3: UI Results Updates (`page.tsx`)
1. **Update Result Cards:**
   - Display the new metrics: "Marginal Distance ($\Delta D$)", "Extra Fuel Cost", "Time Penalty", and "Net Savings".
   - Show fuel consumption information (e.g., "Fuel used for detour").
   - Add warning labels if net savings are negative (e.g., "Not worth the trip").

### Phase 4: Documentation Update
1. Update `docs/nearby-optimizer-update.md`:
   - Prepend the new feature documentation ("Dynamic Path-Based Gas Station Smart Optimizer").
   - Include the new formulas and logic explanations.
   - Ensure the previous documentation remains intact but marked as a reference/previous iteration where applicable.

## Verification & Testing
- Load the application and set various `travelMode` states.
- Verify that selecting `ROUNDABOUT` correctly doubles the one-way distance/time penalty.
- (If destination inputs are implemented) Verify that `ONE_WAY` correctly computes a smaller $\Delta D$ for stations directly on the path.
- Confirm that the fuel consumption unit conversion accurately calculates $C$.
- Validate that the UI clearly explains the "Objective Function" and breakdown of costs for the recommended station.