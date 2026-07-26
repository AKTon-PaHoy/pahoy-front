import { useEffect, useState } from "react";
import { MarkerPin01, SearchLg, User01 } from "@untitledui/icons";
import { useNavigate } from "react-router";

import { ServiceCard } from "@/components/application/service-card/service-card";
import { useReverseGeocode } from "@/hooks/use-reverse-geocode";
import { api } from "@/utils/api";
import { formatCoordinates, fromGeoJSON } from "@/utils/coordinates";

interface Gig {
    id: string;
    talent: string;
    name: string;
    description: string;
    gig_front_img?: string | null;
    images_uris?: string[] | null;
    price: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface UserData {
    username: string;
    email: string;
    location: string | { type: string; coordinates: [number, number] } | null;
}

interface ProfileData {
    first_name: string;
    last_name: string;
    profile_pic: string | null;
}

export const HomeScreen = () => {
    const navigate = useNavigate();
    const [gigs, setGigs] = useState<Gig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [displayName, setDisplayName] = useState<string>("");
    const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
    const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);

    const { address: fullAddress, error: geocodeError } = useReverseGeocode(coordinates);

    // Show a compact location: skip the street (index 0), pick 2 distinct segments
    const shortAddress = (() => {
        if (!fullAddress) return null;
        const parts = fullAddress.split(",").map(s => s.trim());
        // Skip the first part (street name), then pick 2 non-redundant segments
        const candidates = parts.slice(1).filter((part, i, arr) => {
            // Remove parts that are substrings of an earlier part (e.g. "La California Norte" vs "Sector La California Norte")
            return !arr.slice(0, i).some(prev => prev.includes(part) || part.includes(prev));
        });
        return candidates.slice(0, 2).join(", ") || parts.slice(0, 2).join(", ");
    })();

    const displayLocation = shortAddress ?? (geocodeError && coordinates ? formatCoordinates(coordinates.latitude, coordinates.longitude) : null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [gigsResponse, userData, profileData] = await Promise.all([
                    api<{ results: Gig[] }>("/api/gigs/search/"),
                    api<UserData>("/api/auth/user/"),
                    api<ProfileData>("/api/profile/retrieve/"),
                ]);

                setGigs(gigsResponse.results);

                // Use first_name if available, otherwise fall back to username
                const name = profileData.first_name || userData.username;
                setDisplayName(name);
                setProfilePicUrl(profileData.profile_pic);
                setCoordinates(fromGeoJSON(userData.location));
            } catch {
                setGigs([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="flex min-h-dvh flex-col bg-white pb-20">
            {/* Header */}
            <header className="px-4 pt-6 pb-4">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-display-xs font-bold text-primary">
                            ¿Qué tal, {displayName}?
                        </h1>
                        <div className="mt-1 flex items-center gap-1 text-sm text-tertiary">
                            <MarkerPin01 className="size-4" />
                            <span>{displayLocation || "Obteniendo ubicación..."}</span>
                        </div>
                    </div>
                    {/* Avatar — navigates to profile */}
                    <button
                        onClick={() => navigate("/profile")}
                        className="size-12 overflow-hidden rounded-full bg-brand-100"
                        aria-label="Ir a perfil"
                    >
                        {profilePicUrl ? (
                            <img
                                src={profilePicUrl}
                                alt="Foto de perfil"
                                className="size-full object-cover"
                            />
                        ) : (
                            <div className="flex size-full items-center justify-center">
                                <User01 className="size-6 text-brand-600" />
                            </div>
                        )}
                    </button>
                </div>

                {/* Search bar */}
                <button
                    onClick={() => navigate("/search")}
                    className="mt-4 flex w-full items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-left"
                >
                    <SearchLg className="size-5 text-neutral-400" />
                    <span className="text-sm text-neutral-400">
                        ¿Qué necesitas pa&apos; hoy?
                    </span>
                </button>
            </header>

            {/* Nearby section */}
            <section className="flex-1 px-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-primary">
                        Cerca de ti
                    </h2>
                    <button
                        onClick={() => navigate("/search?q=")}
                        className="text-sm font-semibold text-brand-600"
                    >
                        Ver todo
                    </button>
                </div>

                {/* Loading */}
                {isLoading && (
                    <div className="flex items-center justify-center py-12">
                        <div className="size-8 animate-spin rounded-full border-4 border-neutral-200 border-t-brand-600" />
                    </div>
                )}

                {/* Empty state */}
                {!isLoading && gigs.length === 0 && (
                    <div className="flex items-center justify-center py-16">
                        <p className="text-center text-sm text-tertiary">
                            Pronto talentos maravillosos aquí
                        </p>
                    </div>
                )}

                {/* Service cards */}
                {!isLoading && gigs.length > 0 && (
                    <div className="mt-4 flex flex-col gap-3">
                        {gigs.slice(0, 5).map((gig) => (
                            <ServiceCard
                                key={gig.id}
                                gigId={gig.id}
                                name={gig.name}
                                providerName="Proveedor"
                                isVerified
                                price={gig.price}
                                imageUrl={
                                    gig.gig_front_img || gig.images_uris?.[0] || undefined
                                }
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};
