import { useEffect, useRef, useState } from "react";

interface UseReverseGeocodeResult {
    address: string | null;
    isLoading: boolean;
    error: boolean;
}

// Simple in-memory cache to avoid repeated requests for the same coordinates
const geocodeCache = new Map<string, string>();
// Cache of coordinate keys that have previously failed geocoding — prevents retries
const geocodeFailureCache = new Set<string>();

/**
 * Custom hook for reverse geocoding using Nominatim API.
 * Converts latitude/longitude coordinates to a human-readable address.
 *
 * @param coordinates - Object with latitude and longitude, or null to clear
 * @returns Object containing address, loading state, and error state
 */
export function useReverseGeocode(
    coordinates: { latitude: number; longitude: number } | null,
): UseReverseGeocodeResult {
    const [address, setAddress] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<boolean>(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Stabilize coordinates by extracting primitive values for the dependency array.
    // This prevents re-triggering the effect when the caller creates a new object
    // reference with the same lat/lng on every render.
    const lat = coordinates?.latitude ?? null;
    const lng = coordinates?.longitude ?? null;

    useEffect(() => {
        // Clear state when coordinates change or become null
        setAddress(null);
        setIsLoading(false);
        setError(false);

        if (lat === null || lng === null) {
            return;
        }

        const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;

        // Check cache first
        const cached = geocodeCache.get(cacheKey);
        if (cached) {
            setAddress(cached);
            return;
        }

        // Check failure cache - don't retry previously failed coordinates
        if (geocodeFailureCache.has(cacheKey)) {
            setError(true);
            return;
        }

        // AbortController to handle rapid coordinate changes
        const abortController = new AbortController();

        const fetchAddress = async () => {
            setIsLoading(true);
            setError(false);

            try {
                const url = new URL("https://nominatim.openstreetmap.org/reverse");
                url.searchParams.set("format", "json");
                url.searchParams.set("lat", lat.toString());
                url.searchParams.set("lon", lng.toString());
                url.searchParams.set("zoom", "16");

                const response = await fetch(url.toString(), {
                    signal: abortController.signal,
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();

                // Extract display_name from response
                if (data && data.display_name) {
                    geocodeCache.set(cacheKey, data.display_name);
                    setAddress(data.display_name);
                } else {
                    setError(true);
                    geocodeFailureCache.add(cacheKey);
                }
            } catch (err) {
                // Ignore abort errors (expected when coordinates change)
                if (err instanceof Error && err.name === "AbortError") {
                    return;
                }

                setError(true);
                geocodeFailureCache.add(cacheKey);
            } finally {
                setIsLoading(false);
            }
        };

        // Debounce to avoid hitting rate limits
        timeoutRef.current = setTimeout(fetchAddress, 300);

        // Cleanup: abort any pending request when coordinates change or unmounts
        return () => {
            abortController.abort();
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [lat, lng]);

    return { address, isLoading, error };
}
