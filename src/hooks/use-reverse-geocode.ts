import { useEffect, useState } from "react";

interface UseReverseGeocodeResult {
    address: string | null;
    isLoading: boolean;
    error: boolean;
}

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

    useEffect(() => {
        // Clear state when coordinates change or become null
        setAddress(null);
        setIsLoading(false);
        setError(false);

        if (!coordinates) {
            return;
        }

        const { latitude, longitude } = coordinates;

        // AbortController to handle rapid coordinate changes
        const abortController = new AbortController();

        const fetchAddress = async () => {
            setIsLoading(true);
            setError(false);

            try {
                const url = new URL("https://nominatim.openstreetmap.org/reverse");
                url.searchParams.set("format", "json");
                url.searchParams.set("lat", latitude.toString());
                url.searchParams.set("lon", longitude.toString());

                const response = await fetch(url.toString(), {
                    signal: abortController.signal,
                    headers: {
                        // Required by Nominatim API - provide app name
                        "User-Agent": "PaHoy/1.0",
                    },
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();

                // Extract display_name from response
                if (data && data.display_name) {
                    setAddress(data.display_name);
                } else {
                    setError(true);
                }
            } catch (err) {
                // Ignore abort errors (expected when coordinates change)
                if (err instanceof Error && err.name === "AbortError") {
                    return;
                }

                setError(true);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAddress();

        // Cleanup: abort any pending request when coordinates change or unmounts
        return () => {
            abortController.abort();
        };
    }, [coordinates]);

    return { address, isLoading, error };
}
