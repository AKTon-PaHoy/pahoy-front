import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { Plus } from "@untitledui/icons";

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

// Helper function to format price
function formatPrice(price: number, priceType: "Fijo" | "Horas"): string {
    if (priceType === "Horas") {
        return `$${price}/hr`;
    }
    return `Desde $${price}`;
}

// Status Badge Component
function StatusBadge({ isActive }: { isActive: boolean }) {
    const text = isActive ? "Activa" : "Inactiva";
    const bgClass = isActive ? "bg-success-50" : "bg-neutral-100";
    const textClass = isActive ? "text-success-700" : "text-neutral-600";

    return (
        <div
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${bgClass} ${textClass}`}
            aria-label={`Estado: ${text}`}
        >
            {text}
        </div>
    );
}

// Gig Card Component
function GigCard({ gig }: { gig: Gig }) {
    const navigate = useNavigate();

    return (
        <button
            onClick={() => navigate(`/gig/${gig.id}`)}
            className="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-3 text-left transition-all hover:shadow-md active:shadow-sm"
        >
            {/* Image and Badge */}
            <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100">
                {gig.gig_front_img ? (
                    <img
                        src={gig.gig_front_img}
                        alt={gig.name}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-200 to-neutral-300 text-neutral-500">
                        <span className="text-sm">Sin imagen</span>
                    </div>
                )}

                {/* Badge positioned in top right */}
                <div className="absolute top-2 right-2">
                    <StatusBadge isActive={gig.is_active} />
                </div>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-primary line-clamp-2">
                    {gig.name}
                </h3>
                <p className="text-xs text-tertiary line-clamp-1">
                    {gig.description}
                </p>
            </div>

            {/* Price */}
            <div className="text-sm font-medium text-brand-600">
                {formatPrice(gig.price, gig.price_type)}
            </div>
        </button>
    );
}

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
                        className="mt-4 opacity-50 cursor-not-allowed"
                        disabled
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
                                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                                    activeTab === tab
                                        ? "bg-brand-solid text-white shadow-xs"
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
                    <div className="mt-6 grid grid-cols-1 gap-4 pb-8">
                        {gigs.map((gig) => (
                            <GigCard key={gig.id} gig={gig} />
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
