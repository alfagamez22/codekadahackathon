// GasWatch PH - Fuel Price Data
// Last Updated: April 27, 2026
// Source: Community price reports and DOE weekly advisory
//         RON97 = RON95 + historical brand premium; E-gas = RON95 - historical brand differential
// To update prices: Edit the numbers below and change the lastUpdated date

const LAST_UPDATED = "May 5, 2026";

// ─── Advisories / Announcements ──────────────────────────────
const ADVISORIES = [
  {
    date: "2026-05-05",
    expires: "2026-05-12",
    type: "alert",
    title: "May 5 price hike: diesel +₱2.66, gasoline +₱2.21, kerosene −₱3.53",
    body: "Industry-wide adjustment effective 6AM Tuesday after three straight weeks of rollback. Diesel rises ₱2.66/L and gasoline ₱2.21/L, while kerosene drops ₱3.53/L. Confirmed by Shell, Petron, Seaoil, Unioil, Flying V, Cleanfuel, and Jetti — figures match the DOE-OIMB notified adjustments for May 5–11. Cleanfuel and Jetti pump increases run a few centavos lighter (+₱2.60 diesel / +₱2.20 gasoline). The price table below reflects live pump rates as stations switch over.",
  },
  {
    date: "2026-05-05",
    expires: "2026-06-05",
    type: "new",
    title: "DOE diesel subsidy: ₱1,500/week for PUV & PUJ drivers",
    body: "Legitimate PUV and PUJ drivers can claim up to ₱1,500/week in diesel discounts at Petron, Shell, Caltex, Seaoil, Unioil, PTT, Petrogazz, and Jetti stations nationwide. Total, Flying V, Phoenix, and Cleanfuel are onboarding. Maximum discount applies weekly — enrollment and terms per DOE.",
  },
  {
    date: "2026-04-12",
    type: "new",
    title: "Metro Manila Fuel Price History — Now Live",
    body: "You asked, we listened. See weekly average diesel and gasoline prices for every major brand in Metro Manila. Tap 'Price History' in the menu to compare trends across Shell, Petron, Caltex, and 8 other brands. New data added every Tuesday.",
  },
  {
    date: "2026-03-29",
    type: "new",
    title: "Fuel Cost Calculator — estimate your fill-up cost instantly!",
    body: "Tap 'Calculate Cost' on the homepage to estimate your fill-up cost. Pick your fuel type, choose a brand, enter your liters, and get an instant total. It even shows you the cheapest brand option so you know if you're getting a good deal.",
  },
  {
    date: "2026-03-15",
    type: "new",
    title: "Flag a Station When Fuel Runs Out!",
    body: "If a fuel type is unavailable at a station, tap 'No stock' in the station details. It shows up on the map instantly so others know. Flags auto-clear after 48 hours.",
  },
];

// ─── Brand Colors & Info ───────────────────────────────────────
const BRANDS = {
  shell: { name: "Shell", short: "SHL", color: "#FFD500", textColor: "#111" },
  petron: { name: "Petron", short: "PTR", color: "#004B93", textColor: "#fff" },
  caltex: { name: "Caltex", short: "CAL", color: "#E31937", textColor: "#fff" },
  phoenix: { name: "Phoenix", short: "PHX", color: "#FF6600", textColor: "#fff" },
  seaoil: { name: "Seaoil", short: "SEA", color: "#00A651", textColor: "#fff" },
  unioil: { name: "Unioil", short: "UNI", color: "#1B3C73", textColor: "#fff" },
  jetti: { name: "Jetti", short: "JET", color: "#C8102E", textColor: "#fff" },
  flyingv: { name: "Flying V", short: "FLV", color: "#8B0000", textColor: "#fff" },
  cleanfuel: { name: "Cleanfuel", short: "CLN", color: "#00B4D8", textColor: "#fff" },
  total: { name: "Total", short: "TOT", color: "#FF0000", textColor: "#fff" },
  ptt: { name: "PTT", short: "PTT", color: "#5B2C6F", textColor: "#fff" },
};

// ─── Previous Week Prices (for change indicators in Brand Summary) ─
// Last updated: Week of May 5, 2026 — set to prior week brand averages
// Next update: Before applying next Tuesday station scrape
const PREVIOUS_PRICES = {
  shell:      { diesel: 90.37, premiumDiesel: 104.87, unleaded: 88.63, premium95: 97.12, premium97: 100.97, kerosene: 160.37 },
  petron:     { diesel: 88.32, premiumDiesel: 97.83, unleaded: 84.65, premium95: 87.16, premium97: 97.51, kerosene: 155.98 },
  caltex:     { diesel: 94.34, premiumDiesel: 130.86, unleaded: 91.00, premium95: 98.66, premium97: 108.68, kerosene: 133.07 },
  phoenix:    { diesel: 95.55, unleaded: 90.08, egasoline: 91.33, premium95: 95.12, premium97: 98.71 },
  seaoil:     { diesel: 90.59, premiumDiesel: 149.95, unleaded: 87.06, egasoline: 93.54, premium95: 93.15, premium97: 93.49, kerosene: 157.57 },
  unioil:     { diesel: 91.44, premiumDiesel: 90.46, unleaded: 86.40, egasoline: 90.83, premium95: 89.57, premium97: 95.35 },
  jetti:      { diesel: 105.26, unleaded: 87.49, premium95: 92.29, premium97: 95.79 },
  flyingv:    { diesel: 86.31, unleaded: 81.84, premium95: 85.99, premium97: 91.80 },
  cleanfuel:  { diesel: 100.00, unleaded: 91.00, premium95: 95.42, premium97: 85.10 },
  total:      { diesel: 99.95, premiumDiesel: 117.93, unleaded: 88.72, premium95: 93.26, premium97: 98.98 },
  ptt:        { diesel: 106.61, premiumDiesel: 111.22, unleaded: 91.81, premium95: 95.37, premium97: 100.81 },
};

// ─── Previous Week Overall Averages (for homepage stat badges) ──
// Must equal PRICE_HISTORY[0] BEFORE the new Tuesday scrape runs — the homepage
// badge compares current PRICE_HISTORY[0] vs PREV_AVG, so PREV_AVG must match
// what's about to roll into PRICE_HISTORY[1].
// Week of April 29 – May 5, 2026 (snapshot of PRICE_HISTORY[0] pre-May 5 scrape)
const PREV_AVG = { diesel: 92.20, unleaded: 87.69 };

// ─── Price History (weekly snapshots for /price-history page) ──
// Updated every Tuesday alongside PREV_AVG — newest first, keep 12 weeks max
// dieselAvg/unleadedAvg = station-weighted averages across all stations
// brands = per-brand representative prices (diesel + unleaded)
const PRICE_HISTORY = [
  {
    week: "2026-05-06",
    label: "May 6 – 12",
    // Brand values = PRICE_HISTORY[1] + DOE-confirmed May 5 movement
    // (diesel +₱2.66, unleaded +₱2.21; Cleanfuel/Jetti +₱2.60/+₱2.20).
    // Used DOE-aligned numbers because community price reports lag the 6am hike
    // by several hours and the 7:30am scrape mixed fresh + stale brand avgs.
    dieselAvg: 94.85,
    unleadedAvg: 89.90,
    brands: {
      shell:     { diesel: 93.03, unleaded: 90.84 },
      petron:    { diesel: 90.98, unleaded: 86.86 },
      caltex:    { diesel: 97.00, unleaded: 93.21 },
      phoenix:   { diesel: 98.21, unleaded: 92.29 },
      seaoil:    { diesel: 93.25, unleaded: 89.27 },
      unioil:    { diesel: 94.10, unleaded: 88.61 },
      jetti:     { diesel: 107.86, unleaded: 89.69 },
      flyingv:   { diesel: 88.97, unleaded: 84.05 },
      cleanfuel: { diesel: 102.60, unleaded: 93.20 },
      total:     { diesel: 102.61, unleaded: 90.93 },
      ptt:       { diesel: 109.27, unleaded: 94.02 },
    }
  },
  {
    week: "2026-04-29",
    label: "Apr 29 – May 5",
    dieselAvg: 92.20,
    unleadedAvg: 87.69,
    brands: {
      shell:     { diesel: 90.37, unleaded: 88.63 },
      petron:    { diesel: 88.32, unleaded: 84.65 },
      caltex:    { diesel: 94.34, unleaded: 91.00 },
      phoenix:   { diesel: 95.55, unleaded: 90.08 },
      seaoil:    { diesel: 90.59, unleaded: 87.06 },
      unioil:    { diesel: 91.44, unleaded: 86.40 },
      jetti:     { diesel: 105.26, unleaded: 87.49 },
      flyingv:   { diesel: 86.31, unleaded: 81.84 },
      cleanfuel: { diesel: 100.00, unleaded: 91.00 },
      total:     { diesel: 99.95, unleaded: 88.72 },
      ptt:       { diesel: 106.61, unleaded: 91.81 },
    }
  },
  {
    week: "2026-04-22",
    label: "Apr 22 – 28",
    dieselAvg: 101.78,
    unleadedAvg: 87.24,
    // Cleanfuel has 0 community overrides this week — numbers are estimated
    // from peer rollback pattern (Apr 14 −₱23 + Apr 21 −₱24.94 cumulative).
    // Per TopGear Apr 14 coverage, Cleanfuel was cheapest tier. Auto-refresh
    // once community reports land.
    brands: {
      shell:     { diesel: 103.44, unleaded: 90.23 },
      petron:    { diesel: 101.13, unleaded: 85.86 },
      caltex:    { diesel: 104.49, unleaded: 91.88 },
      phoenix:   { diesel: 105.46, unleaded: 90.67 },
      seaoil:    { diesel: 101.64, unleaded: 84.32 },
      unioil:    { diesel: 101.26, unleaded: 86.66 },
      jetti:     { diesel: 105.26, unleaded: 87.49 },
      flyingv:   { diesel: 100.45, unleaded: 85.21 },
      cleanfuel: { diesel: 100.00, unleaded: 91.00 },
      total:     { diesel: 103.40, unleaded: 88.04 },
      ptt:       { diesel: 108.53, unleaded: 92.51 },
    }
  },
  {
    week: "2026-04-15",
    label: "Apr 15 – 21",
    dieselAvg: 134.13,
    unleadedAvg: 94.45,
    brands: {
      shell:     { diesel: 134.02, unleaded: 97.35 },
      petron:    { diesel: 130.56, unleaded: 92.92 },
      caltex:    { diesel: 137.76, unleaded: 98.96 },
      phoenix:   { diesel: 134.25, unleaded: 91.66 },
      seaoil:    { diesel: 131.74, unleaded: 88.98 },
      unioil:    { diesel: 129.30, unleaded: 90.83 },
      jetti:     { diesel: 167.10, unleaded: 100.17 },
      flyingv:   { diesel: 130.94, unleaded: 93.61 },
      cleanfuel: { diesel: 142.00, unleaded: 99.85 },
      total:     { diesel: 144.02, unleaded: 93.56 },
      ptt:       { diesel: 133.28, unleaded: 92.76 },
    }
  },
  {
    week: "2026-04-08",
    label: "Apr 8 – 14",
    dieselAvg: 152.00,
    unleadedAvg: 95.59,
    brands: {
      shell:     { diesel: 158.07, unleaded: 96.49 },
      petron:    { diesel: 147.67, unleaded: 91.66 },
      caltex:    { diesel: 153.85, unleaded: 100.12 },
      phoenix:   { diesel: 149.13, unleaded: 91.81 },
      seaoil:    { diesel: 153.69, unleaded: 95.43 },
      unioil:    { diesel: 149.57, unleaded: 95.58 },
      jetti:     { diesel: 170.10, unleaded: 100.60 },
      flyingv:   { diesel: 157.42, unleaded: 100.24 },
      cleanfuel: { diesel: 142.12, unleaded: 100.02 },
      total:     { diesel: 150.89, unleaded: 94.54 },
      ptt:       { diesel: 152.37, unleaded: 103.03 },
    }
  },
  {
    week: "2026-04-01",
    label: "Apr 1 – 7",
    dieselAvg: 133.19,
    unleadedAvg: 90.93,
    brands: {
      shell:     { diesel: 138.80, unleaded: 93.75 },
      petron:    { diesel: 128.90, unleaded: 88.00 },
      caltex:    { diesel: 133.50, unleaded: 93.95 },
      phoenix:   { diesel: 129.00, unleaded: 85.60 },
      seaoil:    { diesel: 136.10, unleaded: 88.60 },
      unioil:    { diesel: 132.20, unleaded: 89.00 },
      jetti:     { diesel: 151.50, unleaded: 95.20 },
      flyingv:   { diesel: 139.00, unleaded: 96.10 },
      cleanfuel: { diesel: 127.00, unleaded: 94.90 },
      total:     { diesel: 130.70, unleaded: 88.60 },
      ptt:       { diesel: 134.00, unleaded: 99.90 },
    }
  },
  {
    week: "2026-03-25",
    label: "Mar 25 – 31",
    dieselAvg: 121.03,
    unleadedAvg: 89.17,
    brands: {
      shell:     { diesel: 124.53, unleaded: 88.38 },
      petron:    { diesel: 117.97, unleaded: 87.23 },
      caltex:    { diesel: 121.57, unleaded: 92.05 },
      phoenix:   { diesel: 116.96, unleaded: 83.90 },
      seaoil:    { diesel: 123.08, unleaded: 90.85 },
      unioil:    { diesel: 119.62, unleaded: 91.54 },
      jetti:     { diesel: 138.20, unleaded: 95.70 },
      flyingv:   { diesel: 127.90, unleaded: 95.00 },
      cleanfuel: { diesel: 137.22, unleaded: 91.93 },
      total:     { diesel: 118.23, unleaded: 86.27 },
      ptt:       { diesel: 131.15, unleaded: 97.40 },
    }
  },
  {
    week: "2026-03-18",
    label: "Mar 18 – 24",
    dieselAvg: 104.05,
    unleadedAvg: 79.29,
    brands: {
      shell:     { diesel: 105.89, unleaded: 80.20 },
      petron:    { diesel: 99.00, unleaded: 77.21 },
      caltex:    { diesel: 104.10, unleaded: 81.80 },
      phoenix:   { diesel: 99.75, unleaded: 73.40 },
      seaoil:    { diesel: 106.54, unleaded: 82.99 },
      unioil:    { diesel: 99.98, unleaded: 78.68 },
      jetti:     { diesel: 120.20, unleaded: 87.70 },
      flyingv:   { diesel: 111.10, unleaded: 85.30 },
      cleanfuel: { diesel: 121.75, unleaded: 82.70 },
      total:     { diesel: 102.61, unleaded: 77.53 },
      ptt:       { diesel: 114.35, unleaded: 87.70 },
    }
  },
];

// ─── Fuel Types ────────────────────────────────────────────────
const FUEL_TYPES = {
  diesel: "Diesel",
  premiumDiesel: "Premium Diesel",
  unleaded: "Unleaded 91",
  egasoline: "E-Gasoline (RON 91 E10)",
  premium95: "Premium 95",
  premium97: "Premium 97",
  kerosene: "Kerosene",
};

// ─── Gas Stations with Prices ──────────────────────────────────
// Prices in PHP per liter
// Station names and addresses based on verified real locations
// Coordinates are approximate based on actual verified addresses
// Prices are sample data — update weekly from DOE advisory
// Sources: Shell (moonchildcookie.com, find.shell.com), Petron (petron.com, ClickTheCity),
//   Caltex (HSBC/PNB/Yumpu station lists, ClickTheCity, SunStar), Phoenix (phoenixfuels.ph Google Sites),
//   Unioil (eastwestbanker.com, yellow-pages.ph), Seaoil (seaoil.com.ph), Jetti (jetti.com.ph)
const GAS_STATIONS = [
  {
    "id": 1,
    "brand": "shell",
    "name": "Shell EDSA-McKinley",
    "area": "Makati",
    "lat": 14.5501,
    "lng": 121.03,
    "prices": {
      "diesel": 158.6,
      "premiumDiesel": 160.6,
      "unleaded": 99.65,
      "egasoline": null,
      "premium95": 106.55,
      "premium97": 110,
      "kerosene": 160.37
    }
  },
  {
    "id": 2,
    "brand": "petron",
    "name": "Petron EDSA-Arnaiz Dasmariñas",
    "area": "Makati",
    "lat": 14.549,
    "lng": 121.0275,
    "prices": {
      "diesel": 101.13,
      "premiumDiesel": 103.82,
      "unleaded": 85.86,
      "egasoline": null,
      "premium95": 88.26,
      "premium97": 97.46,
      "kerosene": 155.97
    }
  },

  I see this new thing from gaswatchph
  Request URL
https://gaswatchph.com/js/data.js?v=20260505a
Request Method
GET
Status Code
200 OK (from memory cache)
Remote Address
216.150.16.1:443
Referrer Policy
strict-origin-when-cross-origin

I do not know if we can also make request for this one. But if yes this is exactly what we need.