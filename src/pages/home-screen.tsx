import { useEffect, useState } from "react";
import { MarkerPin01, SearchLg } from "@untitledui/icons";
import { useNavigate } from "react-router";

import { ServiceCard } from "@/components/application/service-card/service-card";
import { api } from "@/utils/api";

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

export const HomeScreen = () => {
    const navigate = useNavigate();
    const [gigs, setGigs] = useState<Gig[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchGigs = async () => {
            try {
                const response = await api<{ results: Gig[] }>("/api/gigs/search/");
                setGigs(response.results);
            } catch {
                setGigs([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchGigs();
    }, []);

    return (
        <div className="flex min-h-dvh flex-col bg-white pb-20">
            {/* Header */}
            <header className="px-4 pt-6 pb-4">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-display-xs font-bold text-primary">
                            ¿Qué tal, Guish?
                        </h1>
                        <div className="mt-1 flex items-center gap-1 text-sm text-tertiary">
                            <MarkerPin01 className="size-4" />
                            <span>Sabana Grande, Caracas</span>
                        </div>
                    </div>
                    {/* Avatar */}
                    <div className="size-12 overflow-hidden rounded-full bg-brand-100">
                        <img
                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Guish"
                            alt="Avatar"
                            className="size-full object-cover"
                        />
                    </div>
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
