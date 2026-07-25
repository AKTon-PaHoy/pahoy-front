# Requirements Document

## Introduction

This feature adds a location management section to the existing Profile page, allowing users to update their geographic location via two methods: automatic detection using the browser Geolocation API, or manual selection through an interactive map picker built with Leaflet (react-leaflet). The saved location is displayed as a human-readable address obtained through reverse geocoding (Nominatim/OpenStreetMap). The UI is mobile-first and presented in Spanish, following the existing design patterns of the Pa·Hoy application.

## Glossary

- **Profile_Page**: The existing user profile page located at `src/pages/profile.tsx` that displays and allows editing of user information.
- **Location_Section**: A new UI section within the Profile_Page that displays and manages the user geographic location.
- **Geolocation_API**: The browser-native `navigator.geolocation` API used to obtain the device current geographic coordinates.
- **Map_Picker**: A full-screen modal containing an interactive Leaflet map that allows the user to select a location by tapping or dragging a marker.
- **Reverse_Geocoding_Service**: The Nominatim/OpenStreetMap API used to convert latitude/longitude coordinates into a human-readable address string.
- **Location_API**: The backend endpoint `PATCH /api/auth/update-location/` that accepts `{ latitude, longitude }` and returns an updated User object with GeoJSON location.
- **GeoJSON_Point**: The backend location format `{ type: "Point", coordinates: [longitude, latitude] }` used in the User schema.
- **Location_Modal**: A full-screen modal/bottom sheet that contains the Map_Picker component with a confirm button.

## Requirements

### Requirement 1: Display Current Location

**User Story:** As a user, I want to see my current saved location displayed as a readable address on my profile, so that I can verify my location is correct.

#### Acceptance Criteria

1. WHEN the Profile_Page loads and the authenticated user has a saved GeoJSON_Point location, THE Location_Section SHALL display the corresponding human-readable address obtained from the Reverse_Geocoding_Service.
2. WHEN the Profile_Page loads and the authenticated user has no saved location (coordinates are null or empty), THE Location_Section SHALL display the placeholder text "Sin ubicación registrada".
3. WHILE the Reverse_Geocoding_Service is resolving an address, THE Location_Section SHALL display a loading indicator in place of the address text.
4. IF the Reverse_Geocoding_Service fails to resolve the address, THEN THE Location_Section SHALL display the raw coordinates in the format "lat, lng" as a fallback.

### Requirement 2: Automatic Geolocation

**User Story:** As a user, I want to automatically detect my current location using my device GPS, so that I can quickly set my location without manual interaction.

#### Acceptance Criteria

1. THE Location_Section SHALL display a button labeled "Usar mi ubicación" that triggers automatic geolocation detection.
2. WHEN the user taps the "Usar mi ubicación" button, THE Location_Section SHALL request the device position from the Geolocation_API.
3. WHILE the Geolocation_API is resolving the device position, THE Location_Section SHALL display a loading state on the "Usar mi ubicación" button.
4. WHEN the Geolocation_API returns coordinates successfully, THE Location_Section SHALL send a PATCH request to the Location_API with the obtained latitude and longitude values.
5. IF the Geolocation_API returns a permission denied error, THEN THE Location_Section SHALL display the error message "Permiso de ubicación denegado. Actívalo en la configuración de tu navegador."
6. IF the Geolocation_API returns a position unavailable or timeout error, THEN THE Location_Section SHALL display the error message "No se pudo obtener tu ubicación. Intenta de nuevo."
7. WHEN the Location_API responds successfully after automatic geolocation, THE Location_Section SHALL update the displayed address by performing reverse geocoding on the new coordinates.

### Requirement 3: Manual Map Picker

**User Story:** As a user, I want to select my location manually on an interactive map, so that I can set a precise location even when GPS is unavailable or inaccurate.

#### Acceptance Criteria

1. THE Location_Section SHALL display a button labeled "Seleccionar en mapa" that opens the Location_Modal.
2. WHEN the user taps "Seleccionar en mapa", THE Location_Modal SHALL open as a full-screen overlay with an entrance animation.
3. WHEN the Location_Modal opens and the user has a previously saved location, THE Map_Picker SHALL center on the saved coordinates with a marker at that position.
4. WHEN the Location_Modal opens and the user has no saved location, THE Map_Picker SHALL center on a default position (Bogotá, Colombia: latitude 4.6097, longitude -74.0817).
5. WHEN the user taps on the map, THE Map_Picker SHALL move the marker to the tapped position.
6. THE Location_Modal SHALL display a "Confirmar ubicación" button below the map.
7. WHEN the user taps "Confirmar ubicación", THE Location_Modal SHALL send a PATCH request to the Location_API with the marker latitude and longitude.
8. WHEN the Location_API responds successfully after map selection, THE Location_Modal SHALL close and THE Location_Section SHALL update the displayed address.
9. THE Location_Modal SHALL display OpenStreetMap tiles via the react-leaflet library.
10. THE Location_Modal SHALL include a close/back button that dismisses the modal without saving changes.

### Requirement 4: API Integration and Error Handling

**User Story:** As a user, I want my location updates to be reliably saved to the backend, so that my location persists across sessions and is used for nearby service discovery.

#### Acceptance Criteria

1. WHEN the Location_API is called, THE Location_Section SHALL send the request using the existing `api()` utility with method PATCH and body `{ latitude, longitude }`.
2. WHILE a location update request is in progress, THE Location_Section SHALL disable both location action buttons to prevent duplicate submissions.
3. WHEN the Location_API returns a successful response (200), THE Location_Section SHALL extract the updated location from the returned User object.
4. IF the Location_API returns a 400 validation error, THEN THE Location_Section SHALL display the error message "Coordenadas inválidas. Intenta de nuevo."
5. IF the Location_API returns a 401 unauthorized error, THEN THE Location_Section SHALL follow the existing authentication redirect pattern (clear token and redirect to splash).
6. IF the Location_API returns a network or unexpected error, THEN THE Location_Section SHALL display the error message "Error al actualizar la ubicación. Intenta de nuevo."

### Requirement 5: Coordinate Format Handling

**User Story:** As a developer, I want the frontend to correctly handle the coordinate format differences between the Geolocation API and the backend, so that location data is stored and displayed correctly.

#### Acceptance Criteria

1. WHEN sending coordinates to the Location_API, THE Location_Section SHALL send latitude and longitude as separate numeric fields matching the API contract `{ latitude: number, longitude: number }`.
2. WHEN reading coordinates from the User object response, THE Location_Section SHALL extract latitude from `location.coordinates[1]` and longitude from `location.coordinates[0]` (GeoJSON format: [lng, lat]).
3. WHEN calling the Reverse_Geocoding_Service, THE Location_Section SHALL pass latitude and longitude in the order expected by Nominatim (lat, lon query parameters).

### Requirement 6: UI Layout and Styling

**User Story:** As a user, I want the location section to fit naturally within my profile page and follow the same visual style, so that the experience feels cohesive.

#### Acceptance Criteria

1. THE Location_Section SHALL be positioned within the Profile_Page form area, between the Bio field and the action buttons section.
2. THE Location_Section SHALL use a section label "Ubicación" styled consistently with the existing form field labels (text-sm font-medium text-secondary).
3. THE Location_Section SHALL display the address text using the `text-sm text-tertiary` style token.
4. THE Location_Modal SHALL use the existing Modal, ModalOverlay, and Dialog components from `@/components/application/modals/modal`.
5. THE Location_Section SHALL animate entry using the motion library consistent with other Profile_Page elements.
6. THE Map_Picker within the Location_Modal SHALL occupy the full available height minus the confirm button area.
