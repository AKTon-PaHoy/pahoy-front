import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { Plus } from "@untitledui/icons";

import { ServiceCard } from "@/components/application/service-card/service-card";
import { Button } from "@/components/base/buttons/button";
import { api, ApiError } from "@/utils/api";

// Types
interface Gig {
    id: string;
    talent: string;
    name: string;
    description: string;
    gig_front_img: string | null;
    gig_secong_img: string | null;
    gig_third_img: string | null;
    price: number;
    price_type: "Fijo" | "Horas";
    is_active: boolean;
    rating?: number;
    review_count?: number;
    created_at: string;
    updated_at: string;
}

interface PaginatedGigResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Gig[];
}

type TabFilter = "todas" | "activas" | "inactivas";

// Main Component
export function ChambasScreen() {
    const navigate = useNavigate();
    const [gigs, setGigs] = useState<Gig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabFilter>("todas");

    // Fetch gigs
    const fetchGigs = async (tab: TabFilter) => {
        setIsLoading(true);
        setError(null);
        try {
            const params =
                tab === "activas"
                    ? "?is_active=true"
                    : tab === "inactivas"
                      ? "?is_active=false"
                      : "";
            const response = await api<PaginatedGigResponse>(
                `/api/gigs/my-gigs/${params}`
            );
            setGigs(response.results);
        } catch (err) {
            if (err instanceof ApiError && err.status !== 401) {
                setError("No pudimos cargar tus chambas");
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Toggle gig active status
    const handleToggleStatus = async (gigId: string, isActive: boolean) => {
        // Optimistic update
        setGigs((prev) =>
            prev.map((g) => (g.id === gigId ? { ...g, is_active: isActive } : g))
        );
        try {
            await api(`/api/gigs/update/${gigId}/`, {
                method: "PATCH",
                body: { is_active: isActive },
            });
        } catch {
            // Revert on failure
            setGigs((prev) =>
                prev.map((g) =>
                    g.id === gigId ? { ...g, is_active: !isActive } : g
                )
            );
        }
    };

    // Mount effect
    useEffect(() => {
        fetchGigs(activeTab);
    }, []);

    // Tab change handler
    const handleTabChange = (tab: TabFilter) => {
        setActiveTab(tab);
        fetchGigs(tab);
    };

    // Render empty state
    const renderEmptyState = () => {
        if (activeTab === "todas") {
            return (
                <div className="flex flex-col items-center justify-center gap-4 py-16 px-4 text-center">
                    <div className="text-5xl">📦</div>
                    <h3 className="text-base font-semibold text-primary">
                        Aún no tienes chambas
                    </h3>
                    <p className="text-sm text-tertiary">
                        Crea tu primera chamba y empieza a recibir clientes
                    </p>
                    <Button
                        color="primary"
                        size="md"
                        className="mt-4"
                        onClick={() => navigate("/gigs/new")}
                    >
                        Crear chamba
                    </Button>
                </div>
            );
        }

        const messages = {
            activas: "No tienes chambas activas",
            inactivas: "No tienes chambas inactivas",
        };

        return (
            <div className="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center">
                <div className="text-4xl">✨</div>
                <p className="text-sm text-tertiary">
                    {messages[activeTab]}
                </p>
            </div>
        );
    };

    return (
        <div className="min-h-dvh flex flex-col bg-white pb-20">
            {/* Header */}
            <header className="flex items-center justify-between px-4 pt-4 pb-2">
                <h1 className="text-display-xs font-bold text-primary">
                    Chambas
                </h1>
                <Button
                    color="primary"
                    size="xs"
                    iconLeading={Plus}
                    onClick={() => navigate("/gigs/new")}
                >
                    Nueva
                </Button>
            </header>

            {/* Content */}
            <motion.div
                className="flex flex-1 flex-col px-4 pt-4"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
            >
                {/* Tab Filter */}
                <div
                    className="flex gap-2"
                    role="tablist"
                >
                    {(["todas", "activas", "inactivas"] as const).map(
                        (tab) => (
                            <button
                                key={tab}
                                onClick={() => handleTabChange(tab)}
                                role="tab"
                                aria-selected={activeTab === tab}
                                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                                    activeTab === tab
                                        ? "bg-brand-solid text-white"
                                        : "text-neutral-500 hover:text-neutral-700"
                                }`}
                            >
                                {tab === "todas"
                                    ? "Todas"
                                    : tab === "activas"
                                      ? "Activas"
                                      : "Inactivas"}
                            </button>
                        )
                    )}
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex flex-1 items-center justify-center">
                        <div
                            className="size-8 animate-spin rounded-full border-4 border-neutral-200 border-t-brand-600"
                            aria-label="Cargando"
                        />
                    </div>
                )}

                {/* Error State */}
                {error && !isLoading && (
                    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16">
                        <p className="text-center text-sm text-tertiary">
                            {error}
                        </p>
                        <Button
                            color="primary"
                            size="md"
                            onClick={() => fetchGigs(activeTab)}
                        >
                            Reintentar
                        </Button>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !error && gigs.length === 0 && (
                    renderEmptyState()
                )}

                {/* Gig List */}
                {!isLoading && !error && gigs.length > 0 && (
                    <div className="mt-4 flex flex-col gap-3 pb-8">
                        {gigs.map((gig) => (
                            <ServiceCard
                                key={gig.id}
                                gigId={gig.id}
                                name={gig.name}
                                providerName="Mi chamba"
                                price={gig.price}
                                priceType={gig.price_type}
                                rating={gig.rating}
                                reviewCount={gig.review_count}
                                imageUrl={gig.gig_front_img ?? undefined}
                                status={gig.is_active ? "active" : "inactive"}
                                onToggleStatus={(isActive) =>
                                    handleToggleStatus(gig.id, isActive)
                                }
                            />
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
