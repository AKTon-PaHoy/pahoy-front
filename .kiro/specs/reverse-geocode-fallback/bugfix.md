# Bugfix Requirements Document

## Introduction

The `useReverseGeocode` hook calls the Nominatim API to convert coordinates into a human-readable address. When the API responds with a CORS error or HTTP 429 (rate limit), the hook sets `error: true` but does not prevent retries on subsequent re-renders or minor coordinate changes. Additionally, two of the three consumers (`home-screen.tsx` and `gig-overview.tsx`) ignore the `error` state and show nothing when geocoding fails, instead of falling back to formatted coordinates.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the Nominatim API returns an HTTP error (403, 429, or CORS block) AND the component re-renders or coordinates update slightly THEN the system retries the failed request repeatedly, generating additional failed network calls

1.2 WHEN reverse geocoding fails for given coordinates on the home screen THEN the system displays no location text (the `shortAddress` is null because `address` is null and error state is not checked)

1.3 WHEN reverse geocoding fails for given coordinates on the gig overview TalentCard THEN the system displays no location text (the `shortAddress` is null because `address` is null and error state is not checked)

### Expected Behavior (Correct)

2.1 WHEN the Nominatim API returns any error (CORS, 429, network error, or non-2xx HTTP status) for specific coordinates THEN the system SHALL mark those coordinates as permanently failed and SHALL NOT retry the request for the same coordinates

2.2 WHEN reverse geocoding has failed on the home screen THEN the system SHALL display formatted coordinates (e.g., "-12.0553, -77.0311") using `formatCoordinates()` in place of the address

2.3 WHEN reverse geocoding has failed on the gig overview TalentCard THEN the system SHALL display formatted coordinates (e.g., "-12.0553, -77.0311") using `formatCoordinates()` in place of the address

### Unchanged Behavior (Regression Prevention)

3.1 WHEN reverse geocoding succeeds (Nominatim returns a valid `display_name`) THEN the system SHALL CONTINUE TO display the resolved address in all consumers (home screen, gig overview, location section)

3.2 WHEN coordinates are null or undefined THEN the system SHALL CONTINUE TO show no location or the placeholder "Sin ubicación registrada" as appropriate per consumer

3.3 WHEN the LocationSection component receives an error from geocoding THEN the system SHALL CONTINUE TO display formatted coordinates as fallback (existing working behavior)

3.4 WHEN coordinates change to a new set of valid coordinates that have not previously failed THEN the system SHALL CONTINUE TO attempt reverse geocoding for those new coordinates
