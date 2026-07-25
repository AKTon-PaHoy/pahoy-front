/**
 * Coordinate conversion utilities for handling GeoJSON and API format differences.
 * 
 * GeoJSON format uses [longitude, latitude] array order.
 * The Nominatim API expects lat and lon query parameters in that order.
 * The backend Location_API expects { latitude, longitude } as separate fields.
 */

/**
 * Extracts latitude and longitude from a GeoJSON Point object or a WKT POINT string.
 * 
 * Supported formats:
 * - GeoJSON: { type: "Point", coordinates: [longitude, latitude] }
 * - WKT: "SRID=4326;POINT (longitude latitude)" or "POINT (longitude latitude)"
 * - null/undefined: returns null
 * 
 * @param location - GeoJSON Point object, WKT string, or null/undefined
 * @returns Object with latitude and longitude properties, or null if location is invalid
 */
export function fromGeoJSON(
  location: string | { type: string; coordinates: [number, number] } | null | undefined
): { latitude: number; longitude: number } | null {
  if (location == null) {
    return null;
  }

  // Handle WKT string format: "SRID=4326;POINT (lng lat)" or "POINT (lng lat)"
  if (typeof location === "string") {
    const match = location.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/);
    if (!match) {
      return null;
    }
    const longitude = parseFloat(match[1]);
    const latitude = parseFloat(match[2]);
    if (isNaN(longitude) || isNaN(latitude)) {
      return null;
    }
    return { latitude, longitude };
  }

  // Handle GeoJSON object format
  if (
    typeof location === "object" &&
    Array.isArray(location.coordinates) &&
    location.coordinates.length >= 2
  ) {
    // coordinates[0] = longitude, coordinates[1] = latitude (GeoJSON format)
    return {
      latitude: location.coordinates[1],
      longitude: location.coordinates[0],
    };
  }

  return null;
}

/**
 * Formats coordinates as a human-readable fallback string.
 * Used when reverse geocoding fails and raw coordinates need to be displayed.
 * 
 * @param latitude - The latitude value
 * @param longitude - The longitude value
 * @returns Formatted string "lat, lng" with 4 decimal places
 */
export function formatCoordinates(latitude: number, longitude: number): string {
  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
}
