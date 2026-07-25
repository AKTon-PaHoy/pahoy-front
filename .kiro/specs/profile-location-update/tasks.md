# Implementation Plan: Profile Location Update

## Overview

Add a location management section to the Profile page, enabling users to update their geographic coordinates via browser Geolocation API (automatic) or an interactive Leaflet map picker (manual), with reverse geocoding for human-readable address display. Implementation follows the existing codebase patterns: `api()` utility, `motion` animations, React Aria modal components, Tailwind styling, and Spanish UI text.

## Tasks

- [x] 1. Install dependencies and set up project structure
  - [x] 1.1 Install npm packages for map functionality
    - Run `npm install react-leaflet leaflet` and `npm install -D @types/leaflet`
    - Create directory `src/components/application/location/`
    - _Requirements: 3.9_

- [x] 2. Implement coordinate utilities and reverse geocoding hook
  - [x] 2.1 Create coordinate conversion utilities
    - Create `src/utils/coordinates.ts`
    - Implement `fromGeoJSON()` to extract lat/lng from GeoJSON Point (coordinates[1] = lat, coordinates[0] = lng)
    - Implement `formatCoordinates()` to format as "lat, lng" fallback string
    - _Requirements: 5.2, 1.4_

  - [ ]* 2.2 Write property tests for coordinate utilities
    - **Property 1: GeoJSON coordinate extraction round-trip**
    - **Property 2: Coordinate fallback formatting**
    - **Validates: Requirements 5.2, 4.3, 1.4**

  - [x] 2.3 Create useReverseGeocode custom hook
    - Create `src/hooks/use-reverse-geocode.ts`
    - Fetch from Nominatim API with `lat` and `lon` query parameters
    - Return `{ address, isLoading, error }` state
    - Handle abort/cleanup when coordinates change rapidly
    - _Requirements: 1.1, 1.3, 1.4, 5.3_

  - [ ]* 2.4 Write property test for Nominatim parameter ordering
    - **Property 4: Nominatim parameter ordering**
    - **Validates: Requirements 5.3**

- [x] 3. Checkpoint - Ensure utilities and hook compile correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement map components
  - [x] 4.1 Create DraggableMarker component
    - Create `src/components/application/location/draggable-marker.tsx`
    - Render a Leaflet marker that responds to map click events via `useMapEvents`
    - Expose `position` and `onPositionChange` props
    - _Requirements: 3.5_

  - [ ]* 4.2 Write property test for map marker position updates
    - **Property 6: Map marker follows tap position**
    - **Validates: Requirements 3.5**

  - [x] 4.3 Create LocationMapModal component
    - Create `src/components/application/location/location-map-modal.tsx`
    - Use existing `ModalOverlay`, `Modal`, `Dialog` components from `@/components/application/modals/modal`
    - Import `leaflet/dist/leaflet.css`
    - Render `MapContainer` with OpenStreetMap `TileLayer` and `DraggableMarker`
    - Center on saved coordinates or Bogotá default (4.6097, -74.0817)
    - Include header with close button and "Confirmar ubicación" button
    - Map fills available height; confirm button pinned at bottom
    - Pass `isSubmitting` to disable confirm button during API call
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.9, 3.10, 6.4, 6.6_

  - [ ]* 4.4 Write property test for map initialization with saved coordinates
    - **Property 5: Map initialization with saved coordinates**
    - **Validates: Requirements 3.3**

- [x] 5. Implement LocationSection component
  - [x] 5.1 Create LocationSection shell with address display
    - Create `src/components/application/location/location-section.tsx`
    - Accept `coordinates` and `onLocationUpdated` props
    - Use `useReverseGeocode` hook to display human-readable address
    - Show placeholder "Sin ubicación registrada" when coordinates are null
    - Show loading indicator while geocoding is in progress
    - Show raw coordinates fallback (via `formatCoordinates`) if geocoding fails
    - Section label "Ubicación" styled with `text-sm font-medium text-secondary`
    - Address text styled with `text-sm text-tertiary`
    - Use `motion.div` for entry animation consistent with profile page
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 6.2, 6.3, 6.5_

  - [x] 5.2 Add "Usar mi ubicación" button with browser geolocation
    - Add "Usar mi ubicación" button to LocationSection
    - On tap, call `navigator.geolocation.getCurrentPosition`
    - Show loading state on the button while geolocation resolves
    - On success, call `api()` PATCH `/api/auth/update-location/` with `{ latitude, longitude }`
    - On API success, extract new coordinates via `fromGeoJSON()` and call `onLocationUpdated`
    - Handle Geolocation API errors with Spanish messages:
      - PERMISSION_DENIED → "Permiso de ubicación denegado. Actívalo en la configuración de tu navegador."
      - POSITION_UNAVAILABLE / TIMEOUT → "No se pudo obtener tu ubicación. Intenta de nuevo."
    - Handle API errors (400 → "Coordenadas inválidas. Intenta de nuevo.", network → "Error al actualizar la ubicación. Intenta de nuevo.")
    - Display error messages with `text-sm text-error-primary`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 4.1, 4.3, 4.4, 4.6, 5.1_

  - [x] 5.3 Add "Seleccionar en mapa" button with LocationMapModal integration
    - Add "Seleccionar en mapa" button to LocationSection
    - Manage `isMapOpen` state to control LocationMapModal visibility
    - On tap, open LocationMapModal passing current coordinates
    - On modal confirm callback, call `api()` PATCH `/api/auth/update-location/` with confirmed coordinates
    - On API success, close modal, extract new coordinates via `fromGeoJSON()`, and call `onLocationUpdated`
    - Handle API errors same as 5.2 (display error messages after modal closes)
    - _Requirements: 3.1, 3.7, 3.8, 4.1, 4.3, 4.6, 5.1_

  - [x] 5.4 Wire up mutual button disabling and polish error states
    - Disable both buttons ("Usar mi ubicación" and "Seleccionar en mapa") while any request is in progress (geolocation, API PATCH, or map submission)
    - Clear previous error messages when a new action starts
    - Ensure 401 errors follow existing auth redirect pattern (handled by `api()`)
    - Verify all loading/disabled states transition correctly across both flows
    - _Requirements: 4.2, 4.5_

  - [ ]* 5.5 Write property test for Location API request body format
    - **Property 3: Location API request body format**
    - **Validates: Requirements 4.1, 5.1, 2.4, 3.7**

- [x] 6. Integrate LocationSection into Profile page
  - [x] 6.1 Wire LocationSection into profile.tsx
    - Import `LocationSection` and `fromGeoJSON` in `src/pages/profile.tsx`
    - Extract coordinates from user data using `fromGeoJSON(user.location)`
    - Add state for `userCoordinates`
    - Place `<LocationSection>` between Bio input and action buttons
    - Handle `onLocationUpdated` callback to update local state
    - _Requirements: 1.1, 6.1_

- [x] 7. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- The implementation language is TypeScript, matching the existing codebase
- Leaflet CSS import is required in the map modal to render tiles correctly
- All UI text is in Spanish per the existing application patterns
- The `api()` utility handles auth token injection and 401 redirect automatically

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3"] },
    { "id": 3, "tasks": ["2.4", "4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3"] },
    { "id": 5, "tasks": ["4.4", "5.1"] },
    { "id": 6, "tasks": ["5.2", "5.3"] },
    { "id": 7, "tasks": ["5.4", "5.5"] },
    { "id": 8, "tasks": ["6.1"] }
  ]
}
```
