import { motion } from "motion/react";
import { useReverseGeocode } from "@/hooks/use-reverse-geocode";
import { formatCoordinates, fromGeoJSON } from "@/utils/coordinates";
import { api, ApiError } from "@/utils/api";
import { useState } from "react";
import { LocationMapModal } from "./location-map-modal";

interface LocationSectionProps {
  /** Current saved coordinates from user data, or null if no location */
  coordinates: { latitude: number; longitude: number } | null;
  /** Callback invoked after a successful location update with new coordinates */
  onLocationUpdated: (coords: { latitude: number; longitude: number }) => void;
}

export function LocationSection({ coordinates, onLocationUpdated }: LocationSectionProps) {
  const { address, isLoading: isGeocodingLoading } = useReverseGeocode(coordinates);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isMapSubmitting, setIsMapSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mapConfirmError, setMapConfirmError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Determine what to display: address, loading, placeholder, or fallback
  let displayText: string | null = null;

  if (isGeocodingLoading) {
    displayText = null; // Loading indicator will be shown
  } else if (address) {
    displayText = address;
  } else if (coordinates) {
    // Geocoding failed, show raw coordinates as fallback
    displayText = formatCoordinates(coordinates.latitude, coordinates.longitude);
  } else {
    // No coordinates, show placeholder
    displayText = "Sin ubicación registrada";
  }

  // Handle geolocation button tap
  const handleUseMyLocation = async () => {
    setError(null);
    setIsGeolocating(true);

    try {
      // Request current position from browser geolocation API
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;

      // Call API to update location
      setIsUpdating(true);
      try {
        const response = await api<{
          username: string;
          email: string;
          location: {
            type: string;
            coordinates: [number, number];
          } | null;
        }>("/api/auth/update-location/", {
          method: "PATCH",
          body: { latitude, longitude },
        });

        const newCoords = fromGeoJSON(response.location);
        if (newCoords) {
          onLocationUpdated(newCoords);
          setError(null);
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
        }
      } catch (err) {
        // Handle API errors
        if (err instanceof ApiError) {
          if (err.status === 400) {
            setError("Coordenadas inválidas. Intenta de nuevo.");
          } else {
            setError("Error al actualizar la ubicación. Intenta de nuevo.");
          }
        } else if (err instanceof TypeError) {
          // Network error or other TypeError
          setError("Error al actualizar la ubicación. Intenta de nuevo.");
        } else {
          setError("Error al actualizar la ubicación. Intenta de nuevo.");
        }
      }
    } catch (err) {
      // Handle Geolocation API errors
      if (err instanceof Error) {
        // Type guard to check if it's a GeolocationPositionError
        const code = (err as any).code as number | undefined;
        switch (code) {
          case 1: // PERMISSION_DENIED
            setError("Permiso de ubicación denegado. Actívalo en la configuración de tu navegador.");
            break;
          case 2: // POSITION_UNAVAILABLE
          case 3: // TIMEOUT
            setError("No se pudo obtener tu ubicación. Intenta de nuevo.");
            break;
          default:
            setError("No se pudo obtener tu ubicación. Intenta de nuevo.");
        }
      } else {
        setError("No se pudo obtener tu ubicación. Intenta de nuevo.");
      }
    } finally {
      setIsGeolocating(false);
      setIsUpdating(false);
    }
  };

  // Handle map location confirmation
  const handleMapConfirm = async (coords: { latitude: number; longitude: number }) => {
    setIsMapOpen(false);
    setIsMapSubmitting(true);
    setMapConfirmError(null);

    try {
      const response = await api<{
        username: string;
        email: string;
        location: {
          type: string;
          coordinates: [number, number];
        } | null;
      }>("/api/auth/update-location/", {
        method: "PATCH",
        body: { latitude: coords.latitude, longitude: coords.longitude },
      });

      const newCoords = fromGeoJSON(response.location);
      if (newCoords) {
        onLocationUpdated(newCoords);
        setError(null);
        setMapConfirmError(null);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400) {
          setMapConfirmError("Coordenadas inválidas. Intenta de nuevo.");
        } else {
          setMapConfirmError("Error al actualizar la ubicación. Intenta de nuevo.");
        }
      } else if (err instanceof TypeError) {
        setMapConfirmError("Error al actualizar la ubicación. Intenta de nuevo.");
      } else {
        setMapConfirmError("Error al actualizar la ubicación. Intenta de nuevo.");
      }
    } finally {
      setIsMapSubmitting(false);
      setIsUpdating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full"
    >
      {/* Section Label */}
      <div className="mb-3">
        <span className="text-sm font-medium text-secondary">Ubicación</span>
      </div>

      {/* Address Display */}
      <div className="flex flex-col gap-2">
        {isGeocodingLoading ? (
          <div className="flex items-center gap-2">
            <div className="flex size-5 items-center justify-center rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
            <p className="text-sm text-tertiary">Cargando ubicación...</p>
          </div>
        ) : (
          <p className="text-sm text-tertiary">{displayText}</p>
        )}

        {/* Action Buttons */}
        <div className="mt-3 flex flex-col gap-3">
          {/* "Usar mi ubicación" button */}
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={isGeolocating || isUpdating || isMapSubmitting}
            className={`
              flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5
              text-sm font-semibold transition-colors
              ${isGeolocating || isUpdating || isMapSubmitting
                ? "cursor-not-allowed bg-primary opacity-50"
                : "bg-primary text-secondary hover:bg-primary_hover hover:text-secondary"
              }
            `}
          >
            {isGeolocating ? (
              <>
                <svg
                  className="size-5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="stroke-current opacity-30"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="stroke-current"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    fill="currentColor"
                  />
                </svg>
                <span>Obteniendo ubicación...</span>
              </>
            ) : (
              <>
                <svg
                  className="size-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>Usar mi ubicación</span>
              </>
            )}
          </button>

          {/* "Seleccionar en mapa" button */}
          <button
            type="button"
            onClick={() => setIsMapOpen(true)}
            disabled={isGeolocating || isUpdating || isMapSubmitting}
            className={`
              flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold
              transition-colors
              ${isGeolocating || isUpdating || isMapSubmitting
                ? "cursor-not-allowed bg-primary opacity-50"
                : "bg-primary text-secondary hover:bg-primary_hover hover:text-secondary"
              }
            `}
          >
            <svg
              className="size-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
            <span>Seleccionar en mapa</span>
          </button>
        </div>

        {/* Error Message Area */}
        {(error || mapConfirmError) && (
          <p className="text-sm text-error-primary">
            {mapConfirmError || error}
          </p>
        )}

        {/* Success Message */}
        {showSuccess && (
          <p className="text-sm text-success-primary">
            Ubicación actualizada correctamente
          </p>
        )}
      </div>

      {/* Map Modal */}
      <LocationMapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onConfirm={handleMapConfirm}
        initialCoordinates={coordinates}
        isSubmitting={isUpdating || isMapSubmitting}
      />
    </motion.div>
  );
}
