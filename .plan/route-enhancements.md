# Route Planner Enhancements Plan

## Objective
Implement a collapsible "Recommendations" section, update map markers to resemble Google Maps styles, and introduce smart alternate routing for nearby gas stations.

## Scope & Impact
- **Components Affected:** `components/route/route-planner.tsx`, `components/route/route-map.tsx`
- **UI Changes:** Moves recommendations into the main planning card, updates map icons, adds alternate ETA display.
- **Routing Logic:** Differentiates between "along the way" stops and "detours" based on a strict < 2 minutes threshold.

## Proposed Solution & Implementation Steps

### 1. Collapsible Recommendations Tab (`route-planner.tsx`)
- Add a collapsible UI section (e.g., using `shadcn` Accordion or a simple toggle button) placed directly below the "Destination" input field.
- **Logic:** Ensure this section only shows suggestions if the "Starting Point" is populated. If not, it will display a disabled state or message: *"Please set a starting point to see recommendations."*

### 2. Map Marker Updates (`route-map.tsx`)
- **Start Point (A):** Update the custom Leaflet `divIcon` to a Google Maps-style blue dot. Ensure it has the semi-transparent blue radius circle to represent the Field of View (FOV)/Accuracy.
- **Destination Point (B):** Update the custom Leaflet `divIcon` to a Google Maps-style red pin/circle.

### 3. Nearby Gas Stations & Alternate Routing (`route-planner.tsx` & `route-map.tsx`)
- **Highlighting:** Ensure the top recommended (cheapest) gas station in the nearby list has a distinct green highlight.
- **Smart Routing Calculation:**
  - When a station is selected, fetch a route that passes through it (`Start -> Station -> End`).
  - **Threshold Check (< 2 minutes):** Compare the new route duration with the original route duration.
    - **Along the Way:** If added time is less than 2 minutes, do not plot a secondary route. The original green path remains unchanged, and no extra ETA is displayed.
    - **Detour:** If added time is 2 minutes or more, plot the new route as a secondary **blue path** alongside the original green path.
- **Alternate ETA Display:** When a detour is detected, display a new blue text label next to the original Estimated Travel Time reading: *"Alternate Estimated Travel Time: [X] min"*.

## Verification & Testing
1. Test expanding/collapsing the recommendations section and verify it correctly prompts for a starting point.
2. Verify the map renders the new blue dot (with FOV circle) and red destination markers.
3. Select a gas station clearly on the path (< 2 mins extra) and ensure no blue route or alternate ETA appears.
4. Select a gas station far off the path and verify the blue detour line is plotted and the "Alternate Estimated Travel Time" is displayed in blue text.