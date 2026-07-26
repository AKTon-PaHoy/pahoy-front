# Reverse Geocode Fallback Bugfix Design

## Overview

The `useReverseGeocode` hook lacks a failure cache, causing repeated failed requests to the Nominatim API on re-renders. Additionally, two consumers (`home-screen.tsx` and `gig-overview.tsx`) do not check the `error` state from the hook, resulting in blank location text when geocoding fails. The fix adds a failure cache to prevent retries and updates the two consumers to fall back to formatted coordinates via `formatCoordinates()`.

## Glossary

- **Bug_Condition (C)**: The condition where reverse geocoding has failed for specific coordinates AND the system either retries or displays nothing
- **Property (P)**: Failed coordinates are cached (no retry) and consumers display formatted coordinates as fallback
- **Preservation**: Successful geocoding behavior, null-coordinate handling, and `LocationSection`'s existing fallback logic must remain unchanged
- **useReverseGeocode**: The custom hook in `src/hooks/use-reverse-geocode.ts` that converts lat/lng to a human-readable address via Nominatim
- **geocodeCache**: Existing `Map<string, string>` that stores successful geocode results
- **geocodeFailureCache**: New `Set<string>` to store coordinate keys that have previously failed
- **formatCoordinates**: Utility in `src/utils/coordinates.ts` that formats lat/lng as `"lat, lng"` with 4 decimal places

## Bug Details

### Bug Condition

The bug manifests when the Nominatim API returns an error (CORS, HTTP 429, network failure, or non-2xx response) for given coordinates. The hook sets `error: true` but does not cache the failure, so on re-renders or minor coordinate changes the same failing request is retried. Meanwhile, `home-screen.tsx` and `gig-overview.tsx` only destructure `address` from the hook (ignoring `error`), so when `address` is null due to failure, the UI shows nothing.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { coordinates: { latitude, longitude }, apiResponse: Response | Error }
  OUTPUT: boolean

  RETURN coordinates IS NOT NULL
         AND apiResponse IS error (CORS, 429, network error, or non-2xx HTTP status)
         AND (coordinatesNotInFailureCache(coordinates)
              OR consumerDoesNotCheckErrorState(consumer))
END FUNCTION
```

### Examples

- User at coordinates (-12.0553, -77.0311) opens home screen → Nominatim returns 429 → hook sets `error: true` → `shortAddress` is null → no location shown. On next re-render, the same request fires again.
- Talent at coordinates (4.6351, -74.0703) viewed on gig overview → Nominatim CORS block → hook sets `error: true` → TalentCard shows no location. Navigation away and back re-triggers the failed request.
- User at coordinates (-12.0553, -77.0311) with successful response → displays "Miraflores, Lima" (this should NOT change).
- Coordinates are null → shows no location or placeholder (this should NOT change).

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- When Nominatim returns a valid `display_name`, all consumers continue to display the resolved address
- When coordinates are null, consumers show no location or the placeholder "Sin ubicación registrada" as appropriate
- `LocationSection` already handles the fallback correctly (checks `address` then falls back to `formatCoordinates`) — its logic must not change
- When coordinates change to new values not in the failure cache, the hook attempts geocoding normally
- The existing success cache (`geocodeCache`) continues to work as before

**Scope:**
All inputs that do NOT involve a failed Nominatim response should be completely unaffected by this fix. This includes:
- Successful geocode responses
- Null/undefined coordinates
- Cached successful lookups
- `LocationSection` component behavior

## Hypothesized Root Cause

Based on the bug description, the most likely issues are:

1. **Missing Failure Cache**: The hook only caches successful results in `geocodeCache`. When geocoding fails, there is no record of the failure, so the next render cycle with the same coordinates triggers a new request.

2. **Consumers Ignoring Error State**: `home-screen.tsx` destructures only `{ address: fullAddress }` and `gig-overview.tsx` destructures only `{ address }`. Neither checks `error`, so when `address` is null due to failure (not loading), the `shortAddress` IIFE returns null and no text is rendered.

3. **No Degraded Display Path**: Unlike `LocationSection` which has `else if (coordinates) { displayText = formatCoordinates(...) }`, the other two consumers have no fallback branch for the error case.

## Correctness Properties

Property 1: Bug Condition - Failed Coordinates Are Not Retried

_For any_ input where the Nominatim API has previously failed for a given coordinate key, the fixed `useReverseGeocode` hook SHALL immediately set `error: true` and `isLoading: false` without making a network request, preventing unnecessary retries.

**Validates: Requirements 2.1**

Property 2: Bug Condition - Consumers Display Fallback on Error

_For any_ input where `useReverseGeocode` returns `error: true` and coordinates are non-null, the fixed consumers (`home-screen.tsx` and `gig-overview.tsx`) SHALL display formatted coordinates (e.g., "-12.0553, -77.0311") using `formatCoordinates(latitude, longitude)`.

**Validates: Requirements 2.2, 2.3**

Property 3: Preservation - Successful Geocoding Unchanged

_For any_ input where the Nominatim API returns a valid `display_name`, the fixed hook and consumers SHALL produce the same result as the original code, preserving address resolution and display behavior.

**Validates: Requirements 3.1, 3.4**

Property 4: Preservation - Null Coordinates Unchanged

_For any_ input where coordinates are null or undefined, the fixed code SHALL produce the same result as the original code, preserving the no-location/placeholder behavior.

**Validates: Requirements 3.2, 3.3**

## Fix Implementation

### Changes Required

**File**: `src/hooks/use-reverse-geocode.ts`

**Specific Changes**:
1. **Add failure cache**: Create a module-level `Set<string>` named `geocodeFailureCache` alongside the existing `geocodeCache`
2. **Check failure cache before fetching**: After checking `geocodeCache`, check if `cacheKey` exists in `geocodeFailureCache`. If so, set `error: true` immediately and return without fetching
3. **Populate failure cache on error**: In the `catch` block and in the `else` branch (no `display_name`), add the `cacheKey` to `geocodeFailureCache`

---

**File**: `src/pages/home-screen.tsx`

**Function**: `HomeScreen` component

**Specific Changes**:
1. **Destructure `error`**: Change `const { address: fullAddress } = useReverseGeocode(coordinates)` to `const { address: fullAddress, error: geocodeError } = useReverseGeocode(coordinates)`
2. **Import `formatCoordinates`**: Add `formatCoordinates` to the import from `@/utils/coordinates`
3. **Add fallback branch**: After the `shortAddress` IIFE, if `shortAddress` is null AND `geocodeError` is true AND `coordinates` is not null, compute fallback using `formatCoordinates(coordinates.latitude, coordinates.longitude)`

---

**File**: `src/pages/gig-overview.tsx`

**Function**: `TalentCard` component

**Specific Changes**:
1. **Destructure `error`**: Change `const { address } = useReverseGeocode(coordinates)` to `const { address, error: geocodeError } = useReverseGeocode(coordinates)`
2. **Import `formatCoordinates`**: Add `formatCoordinates` to the import from `@/utils/coordinates`
3. **Add fallback branch**: After the `shortAddress` IIFE, if `shortAddress` is null AND `geocodeError` is true AND `coordinates` is not null, compute fallback using `formatCoordinates(coordinates.latitude, coordinates.longitude)`

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that mock Nominatim API failures and observe hook behavior across multiple renders. Run these tests on the UNFIXED code to observe failures.

**Test Cases**:
1. **Retry on re-render**: Render hook with coordinates, mock 429 response, re-render — observe a second network request fires (will fail on unfixed code: request IS made)
2. **Home screen blank on error**: Render `HomeScreen` with coordinates, mock API failure — observe no location text displayed (will fail on unfixed code: blank shown)
3. **Gig overview blank on error**: Render `TalentCard` with coordinates, mock API failure — observe no location text displayed (will fail on unfixed code: blank shown)
4. **Multiple failures accumulate**: Render hook, trigger 3 re-renders with same failing coordinates — observe 3 separate fetch calls (will fail on unfixed code: all 3 requests fire)

**Expected Counterexamples**:
- Hook makes repeated network requests for the same failed coordinates
- Consumer components render empty location when `error: true`
- Possible causes: no failure cache, consumers not reading `error` state

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := useReverseGeocode_fixed(input.coordinates)
  ASSERT result.error == true
  ASSERT noNetworkRequestMade (if coordinates in failure cache)
  ASSERT consumerDisplays(formatCoordinates(input.coordinates))
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT useReverseGeocode_original(input) == useReverseGeocode_fixed(input)
  ASSERT consumerDisplay_original(input) == consumerDisplay_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for successful geocoding and null coordinates, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Successful geocode preservation**: Mock successful Nominatim response, verify address displays correctly in all consumers after fix
2. **Null coordinates preservation**: Pass null coordinates, verify hook returns `{ address: null, isLoading: false, error: false }` unchanged
3. **Success cache preservation**: Verify `geocodeCache` still works — second render with same coordinates skips fetch
4. **LocationSection unchanged**: Verify `LocationSection` behavior is identical before and after fix

### Unit Tests

- Test `useReverseGeocode` with mocked 429 response: verify `error: true` and no retry
- Test `useReverseGeocode` with same coordinates after failure: verify no fetch call made
- Test `useReverseGeocode` with new coordinates after failure of different ones: verify fetch is attempted
- Test consumer components render `formatCoordinates()` output when `error` is true

### Property-Based Tests

- Generate random coordinate pairs, mock random success/failure responses, verify failure cache prevents retries for all failed coordinates
- Generate random coordinate pairs with successful responses, verify behavior identical to original hook
- Generate random sequences of null → valid → null coordinates, verify state transitions are correct

### Integration Tests

- Full flow: render home screen → API fails → verify fallback coordinates shown → navigate away → return → verify no new request
- Full flow: render gig overview → API fails → verify TalentCard shows fallback → change gig → verify new coordinates attempted
- Mixed scenario: some coordinates succeed, some fail → verify correct display for each
