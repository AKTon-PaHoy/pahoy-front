# Design Document

## Introduction

This document details the architecture for adding a location management section to the Profile page. The feature allows users to update their geographic coordinates via browser Geolocation API (automatic) or an interactive Leaflet map picker (manual), with reverse geocoding for human-readable display. The implementation follows existing codebase patterns: `api()` utility for backend calls, `motion` for animations, React Aria modal components, and Tailwind styling with Spanish UI text.

## Architecture Overview

The feature is implemented as a self-contained `LocationSection` component embedded in the existing Profile page form. It manages its own state for coordinates, address display, loading, and errors. A full-screen modal (`LocationMapModal`) houses the interactive Leaflet map picker. A custom hook (`useReverseGeocode`) encapsulates the Nominatim API call logic. Coordinate format conversion utilities handle the GeoJSON ↔ API ↔ Nominatim format differences.

```
Profile Page (profile.tsx)
├── ... existing fields (name, phone, bio) ...
├── LocationSection
│   ├── Address display (text or loading or fallback)
│   ├── "Usar mi ubicación" button (auto geolocation)
│   ├── "Seleccionar en mapa" button (opens modal)
│   └── Error message area
└── LocationMapModal (full-screen)
    ├── Header with close button
    ├── MapContainer (react-leaflet)
    │   ├── TileLayer (OpenStreetMap)
    │   └── DraggableMarker
    └── "Confirmar ubicación" button
```

## Components

### 1. LocationSection

**File:** `src/components/application/location/location-section.tsx`

A self-contained component that manages the entire location feature within the Profile page.

```typescript
interface LocationSectionProps {
  /** Current saved coordinates from user data, or null if no location */
  coordinates: { latitude: number; longitude: number } | null;
  /** Callback invoked after a successful location update with new coordinates */
  onLocationUpdated: (coords: { latitude: number; longitude: number }) => void;
}
```

**State:**
- `address: string | null` — resolved human-readable address
- `isGeolocating: boolean` — loading state for the geolocation button
- `isUpdating: boolean` — loading state for the API PATCH request
- `isGeocodingLoading: boolean` — loading state for reverse geocoding
- `error: string | null` — error message to display
- `isMapOpen: boolean` — controls modal visibility

**Behavior:**
- On mount/coordinates change: triggers reverse geocoding to display address
- "Usar mi ubicación" button: calls `navigator.geolocation.getCurrentPosition`, then PATCHes API
- "Seleccionar en mapa" button: opens `LocationMapModal`
- Disables both buttons while any request is in progress
- Displays error messages below the buttons with `text-sm text-error-primary`

### 2. LocationMapModal

**File:** `src/components/application/location/location-map-modal.tsx`

Full-screen modal with an interactive Leaflet map for manual location selection.

```typescript
interface LocationMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (coords: { latitude: number; longitude: number }) => void;
  initialCoordinates: { latitude: number; longitude: number } | null;
  isSubmitting: boolean;
}
```

**Behavior:**
- Uses existing `DialogTrigger`, `ModalOverlay`, `Modal`, `Dialog` components
- Map centers on `initialCoordinates` or defaults to Bogotá (4.6097, -74.0817)
- User taps on map to move the marker
- "Confirmar ubicación" button sends the current marker position via `onConfirm`
- Close/back button dismisses without saving

### 3. DraggableMarker

**File:** `src/components/application/location/draggable-marker.tsx`

Internal component that renders a Leaflet marker that responds to map click events.

```typescript
interface DraggableMarkerProps {
  position: [number, number]; // [lat, lng]
  onPositionChange: (position: [number, number]) => void;
}
```

## Custom Hook

### useReverseGeocode

**File:** `src/hooks/use-reverse-geocode.ts`

Encapsulates reverse geocoding logic using Nominatim.

```typescript
interface UseReverseGeocodeResult {
  address: string | null;
  isLoading: boolean;
  error: boolean;
}

function useReverseGeocode(
  coordinates: { latitude: number; longitude: number } | null
): UseReverseGeocodeResult;
```

**Behavior:**
- When `coordinates` changes and is non-null, fetches from `https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lng}`
- Returns the `display_name` from the response as `address`
- Sets `isLoading` during the fetch
- Sets `error: true` if the fetch fails (the component then shows raw coordinates as fallback)
- Debounces or aborts previous requests when coordinates change rapidly

## Utility Functions

### Coordinate Conversion

**File:** `src/utils/coordinates.ts`

```typescript
/**
 * Extracts latitude and longitude from a GeoJSON Point object.
 * GeoJSON format: { type: "Point", coordinates: [longitude, latitude] }
 */
export function fromGeoJSON(
  location: { type: string; coordinates: [number, number] } | null
): { latitude: number; longitude: number } | null;

/**
 * Formats coordinates as a human-readable fallback string.
 */
export function formatCoordinates(
  latitude: number,
  longitude: number
): string;
// Returns: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
```

## API Integration

### Update Location

```typescript
// Request
await api<UserResponse>("/api/auth/update-location/", {
  method: "PATCH",
  body: { latitude: number, longitude: number },
});

// Response (UserResponse shape - relevant fields)
interface UserResponse {
  username: string;
  email: string;
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude] - GeoJSON
  } | null;
}
```

### Error Handling Strategy

| HTTP Status | Error Source | User Message |
|-------------|------------|--------------|
| Geolocation PERMISSION_DENIED | Browser API | "Permiso de ubicación denegado. Actívalo en la configuración de tu navegador." |
| Geolocation POSITION_UNAVAILABLE / TIMEOUT | Browser API | "No se pudo obtener tu ubicación. Intenta de nuevo." |
| 400 | Location_API | "Coordenadas inválidas. Intenta de nuevo." |
| 401 | Location_API | Handled by `api()` — clears token, redirects to splash |
| Network/Other | Location_API | "Error al actualizar la ubicación. Intenta de nuevo." |

## Data Flow

### Automatic Geolocation Flow

```
User taps "Usar mi ubicación"
  → navigator.geolocation.getCurrentPosition()
  → On success: PATCH /api/auth/update-location/ { latitude, longitude }
  → On API success: extract location from response via fromGeoJSON()
  → Trigger useReverseGeocode with new coordinates
  → Display resolved address
```

### Manual Map Selection Flow

```
User taps "Seleccionar en mapa"
  → Open LocationMapModal
  → Map centers on saved coords or Bogotá default
  → User taps map → marker moves to tap position
  → User taps "Confirmar ubicación"
  → PATCH /api/auth/update-location/ { latitude, longitude }
  → On API success: close modal, update coordinates
  → Trigger useReverseGeocode with new coordinates
  → Display resolved address
```

### Initial Load Flow

```
Profile page fetches GET /api/auth/user/
  → Response includes location field (GeoJSON Point or null)
  → fromGeoJSON() extracts { latitude, longitude } or null
  → Pass coordinates to LocationSection
  → useReverseGeocode resolves address (or shows placeholder/fallback)
```

## Dependencies

New npm packages required:
- `react-leaflet` — React bindings for Leaflet maps
- `leaflet` — Map rendering library
- `@types/leaflet` — TypeScript type definitions (devDependency)

Leaflet CSS must be imported in the map modal component:
```typescript
import "leaflet/dist/leaflet.css";
```

## UI Layout Integration

The `LocationSection` is placed in `profile.tsx` between the Bio `<Input>` and the success message / buttons section:

```tsx
{/* ... Bio input ... */}

<LocationSection
  coordinates={userCoordinates}
  onLocationUpdated={(coords) => setUserCoordinates(coords)}
/>

{showSuccess && (/* ... */)}
{/* ... buttons ... */}
```

### Section Layout

```
┌──────────────────────────────────┐
│ Ubicación (label)                │
│ Calle 123, Bogotá, Colombia     │  ← address or placeholder
│                                  │
│ [📍 Usar mi ubicación        ]   │  ← secondary button
│ [🗺️ Seleccionar en mapa     ]   │  ← secondary button
│                                  │
│ Error message (if any)           │
└──────────────────────────────────┘
```

### Map Modal Layout

```
┌──────────────────────────────────┐
│ ← (close)    Seleccionar        │  ← header
│              ubicación           │
├──────────────────────────────────┤
│                                  │
│          [MAP AREA]              │  ← flex-1, fills remaining space
│            📍                    │
│                                  │
├──────────────────────────────────┤
│  [ Confirmar ubicación ]         │  ← primary button, full width
│                                  │
└──────────────────────────────────┘
```

## Animation

- LocationSection uses `motion.div` with the same entry animation as other profile elements: `initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}`
- The modal uses existing `ModalOverlay` and `Modal` enter/exit animations (fade-in/zoom-in from React Aria)

## File Structure

```
src/
├── components/application/location/
│   ├── location-section.tsx        # Main section component
│   ├── location-map-modal.tsx      # Full-screen map modal
│   └── draggable-marker.tsx        # Map marker component
├── hooks/
│   └── use-reverse-geocode.ts      # Reverse geocoding hook
├── utils/
│   └── coordinates.ts              # Coordinate conversion utilities
└── pages/
    └── profile.tsx                  # Modified to include LocationSection
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: GeoJSON coordinate extraction round-trip

For any valid GeoJSON Point object with coordinates `[lng, lat]`, the `fromGeoJSON()` function SHALL extract `latitude` from index 1 and `longitude` from index 0, such that re-encoding would produce the original GeoJSON coordinate array.

**Validates: Requirements 5.2, 4.3, 1.1**

### Property 2: Coordinate fallback formatting

For any valid latitude and longitude pair where reverse geocoding fails, the displayed fallback text SHALL contain the latitude value followed by the longitude value in a "lat, lng" format string.

**Validates: Requirements 1.4**

### Property 3: Location API request body format

For any location update triggered by either automatic geolocation or manual map selection, the PATCH request body sent to `/api/auth/update-location/` SHALL contain exactly `{ latitude: number, longitude: number }` with the values matching the source coordinates (from Geolocation API or map marker position).

**Validates: Requirements 4.1, 5.1, 2.4, 3.7**

### Property 4: Nominatim parameter ordering

For any coordinate pair passed to the reverse geocoding service, the request SHALL include `lat` as the latitude value and `lon` as the longitude value in the query parameters, matching Nominatim's expected parameter order.

**Validates: Requirements 5.3**

### Property 5: Map initialization with saved coordinates

For any valid saved coordinate pair, when the Location_Modal opens, the map center and marker position SHALL both equal the saved coordinates (latitude, longitude).

**Validates: Requirements 3.3**

### Property 6: Map marker follows tap position

For any tap event on the map at coordinates (lat, lng), the marker position SHALL update to match the tapped coordinates exactly.

**Validates: Requirements 3.5**
