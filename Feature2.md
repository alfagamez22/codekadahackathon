
## Plan & data source options

### Proposed plan
1. Keep the community price UI working (done) and wire it to the Next.js proxy route.
2. Identify a reliable station locations dataset and define a schema (stationId, name, lat/lng, brand, address).
3. Add a station locations fetcher + transform step (API or scrape).
4. Join community prices with station locations via stationId/brand/address fuzzy matching.
5. Update Nearby page to show price cards with real station names + map pins.

### Options for station locations + prices (Philippines)
1. **Open data / government datasets**
	- Look for LGU or DOE open data portals with fuel station locations.
	- Pros: legal, stable. Cons: may be incomplete or outdated.

2. **Crowdsourcing within the app**
	- Let users add/update stations (name, brand, address, GPS) and prices.
	- Pros: fully compliant, grows over time. Cons: slower data coverage.

3. **Partner or private data source**
	- Reach out to industry partners or a data provider with verified station lists.
	- Pros: accurate. Cons: licensing cost, access negotiation.

4. **Map provider APIs** (Places search)
	- Use Google Places, Mapbox, or OpenStreetMap (Overpass) to query “gas stations”.
	- Pros: comprehensive and legal if within API terms. Cons: usage limits, pricing.
	- OSM Overpass can be used for open data; requires rate limiting + caching.

5. **Web scraping (last resort)**
	- Only if the target site’s Terms allow scraping.
	- Risks: legal/ToS, blocking, data volatility, no guaranteed station IDs.
	- If you want this, I can propose specific sources after checking their terms.

### Recommendation (short-term)
- Use **OpenStreetMap/Overpass** to get station locations, then map community prices by approximate name/brand + proximity.
- Keep community pricing from gaswatch, but store a local station registry for stable IDs.

### Next step decisions
- Which source should we prioritize: OSM/Overpass, partner data, or in-app crowdsourcing?
- Do we have a budget for Places APIs if needed?
