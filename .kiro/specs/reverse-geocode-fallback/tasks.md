# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Reverse Geocode Retries and Blank Display on Failure
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to concrete failing cases: mock Nominatim returning 429/CORS error for coordinates (-12.0553, -77.0311)
  - Test that `useReverseGeocode` does NOT retry after a failed response for the same coordinates on re-render (from Bug Condition: `isBugCondition` — coordinates not null AND apiResponse is error AND coordinatesNotInFailureCache)
  - Test that `home-screen.tsx` and `gig-overview.tsx` display `formatCoordinates(lat, lng)` when `error: true` (from Expected Behavior: consumers SHALL display formatted coordinates)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists: hook retries failed requests, consumers show blank)
  - Document counterexamples found (e.g., "hook makes 2nd fetch for same failed coordinates", "HomeScreen renders no location text when error is true")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Successful Geocoding and Null Coordinates Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: `useReverseGeocode({ latitude: -12.0553, longitude: -77.0311 })` with successful Nominatim response returns the resolved `display_name` address on unfixed code
  - Observe: `useReverseGeocode(null)` returns `{ address: null, isLoading: false, error: false }` on unfixed code
  - Observe: Second render with same successful coordinates skips fetch (uses `geocodeCache`)
  - Write property-based test: for all non-null coordinates where Nominatim returns a valid `display_name`, the hook returns `{ address: display_name, error: false }` (from Preservation Requirements in design)
  - Write property-based test: for null coordinates, hook returns `{ address: null, isLoading: false, error: false }` (from Preservation Requirements in design)
  - Verify tests pass on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3. Fix reverse geocode failure handling and consumer fallback

  - [x] 3.1 Add `geocodeFailureCache` to `src/hooks/use-reverse-geocode.ts`
    - Add module-level `const geocodeFailureCache = new Set<string>()` alongside existing `geocodeCache`
    - After checking `geocodeCache`, check if `cacheKey` exists in `geocodeFailureCache` — if so, set `error: true` and return early without fetching
    - In the `catch` block (non-abort errors) and the `else` branch (no `display_name`), add `cacheKey` to `geocodeFailureCache`
    - _Bug_Condition: isBugCondition(input) where coordinates IS NOT NULL AND apiResponse IS error AND coordinatesNotInFailureCache_
    - _Expected_Behavior: hook SHALL set error: true and NOT retry for coordinates in failure cache_
    - _Preservation: Successful geocoding, null coordinates, and existing geocodeCache behavior unchanged_
    - _Requirements: 2.1, 3.1, 3.2, 3.4_

  - [x] 3.2 Update `src/pages/home-screen.tsx` with fallback display
    - Destructure `error` from `useReverseGeocode`: `const { address: fullAddress, error: geocodeError } = useReverseGeocode(coordinates)`
    - Import `formatCoordinates` from `@/utils/coordinates`
    - After the `shortAddress` IIFE, compute display location: if `shortAddress` is null AND `geocodeError` is true AND `coordinates` is not null, use `formatCoordinates(coordinates.latitude, coordinates.longitude)` as fallback
    - _Bug_Condition: consumer does not check error state, shows blank_
    - _Expected_Behavior: display formatted coordinates when geocoding fails_
    - _Preservation: When address resolves successfully, display remains unchanged_
    - _Requirements: 2.2, 3.1_

  - [x] 3.3 Update `src/pages/gig-overview.tsx` TalentCard with fallback display
    - Destructure `error` from `useReverseGeocode`: `const { address, error: geocodeError } = useReverseGeocode(coordinates)`
    - Import `formatCoordinates` from `@/utils/coordinates`
    - After the `shortAddress` IIFE, compute display location: if `shortAddress` is null AND `geocodeError` is true AND `coordinates` is not null, use `formatCoordinates(coordinates.latitude, coordinates.longitude)` as fallback
    - _Bug_Condition: consumer does not check error state, shows blank_
    - _Expected_Behavior: display formatted coordinates when geocoding fails_
    - _Preservation: When address resolves successfully, display remains unchanged_
    - _Requirements: 2.3, 3.1_

  - [x] 3.4 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Reverse Geocode No-Retry and Fallback Display
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.5 Verify preservation tests still pass
    - **Property 2: Preservation** - Successful Geocoding and Null Coordinates Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

- [x] 4. Checkpoint - Ensure all tests pass and build succeeds
  - Run `npm run build` to verify TypeScript compilation and production build
  - Ensure all tests pass, ask the user if questions arise
