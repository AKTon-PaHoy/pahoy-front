import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, SearchLg } from "@untitledui/icons";
import { useNavigate, useSearchParams } from "react-router";

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

const DISTANCE_OPTIONS = [
    { label: "5 km", value: "5" },
    { label: "10 km", value: "10" },
    { label: "25 km", value: "25" },
    { label: "50 km", value: "50" },
    { label: "100 km", value: "100" },
];

const DEFAULT_DISTANCE = "10";

export function Search() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialQuery = searchParams.get("q") || "";
    const initialDistance = searchParams.get("distance") || DEFAULT_DISTANCE;

    const [query, setQuery] = useState(initialQuery);
    const [distance, setDistance] = useState(initialDistance);
    const [results, setResults] = useState<Gig[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const manualSearchRef = useRef(false);

    const performSearch = useCallback(
        async (searchText: string, dist: string) => {
            setIsLoading(true);
            setHasSearched(true);

            try {
                const params = new URLSearchParams();
                if (searchText.trim()) {
                    params.set("search", searchText.trim());
                }
                params.set("distance", dist);
                const queryString = params.toString() ? `?${params.toString()}` : "";
                const response = await api<{ results: Gig[] }>(
                    `/api/gigs/search/${queryString}`,
                );
                setResults(response.results);
            } catch {
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        },
        [],
    );

    // Search on mount if query param exists (including empty string from "Ver todo")
    useEffect(() => {
        if (searchParams.has("q")) {
            performSearch(initialQuery, initialDistance);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Focus the input on mount if no initial query
    useEffect(() => {
        if (!initialQuery && inputRef.current) {
            inputRef.current.focus();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-search after 3 seconds of no typing
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        // Skip auto-search if the last action was a manual submit
        if (manualSearchRef.current) {
            return;
        }

        if (query.trim() && query !== initialQuery) {
            debounceRef.current = setTimeout(() => {
                setSearchParams({ q: query.trim(), distance });
                performSearch(query, distance);
            }, 3000);
        }

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

    // Re-search when distance changes (if we already have a search)
    useEffect(() => {
        if (hasSearched) {
            setSearchParams({ q: query.trim(), distance });
            performSearch(query, distance);
        }
    }, [distance]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        manualSearchRef.current = true;
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        setSearchParams({ q: query.trim(), distance });
        performSearch(query, distance);
    };

    return (
        <div className="flex min-h-dvh flex-col bg-white pb-20">
            {/* Search header */}
            <header className="sticky top-0 z-40 border-b border-neutral-100 bg-white px-4 pt-4 pb-3">
                <form
                    onSubmit={handleSubmit}
                    className="flex items-center gap-2"
                >
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="flex size-10 shrink-0 items-center justify-center rounded-lg text-neutral-500"
                        aria-label="Volver"
                    >
                        <ChevronLeft className="size-6" />
                    </button>

                    <div className="flex flex-1 items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5">
                        <SearchLg className="size-5 shrink-0 text-neutral-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => {
                                manualSearchRef.current = false;
                                setQuery(e.target.value);
                            }}
                            placeholder="¿Qué necesitas pa' hoy?"
                            className="w-full bg-transparent text-sm text-primary outline-none placeholder:text-neutral-400"
                        />
                    </div>
                </form>

                {/* Distance filter */}
                <div className="mt-2 flex items-center gap-2 pl-12">
                    <span className="text-xs font-medium text-tertiary">Distancia:</span>
                    <div className="flex gap-1.5">
                        {DISTANCE_OPTIONS.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => setDistance(option.value)}
                                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                                    distance === option.value
                                        ? "bg-brand-600 text-white"
                                        : "bg-neutral-100 text-tertiary hover:bg-neutral-200"
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Results */}
            <section className="flex-1 px-4 pt-4">
                {hasSearched && (
                    <h2 className="mb-4 text-lg font-bold text-primary">
                        Resultados
                    </h2>
                )}

                {isLoading && (
                    <div className="flex items-center justify-center py-12">
                        <div className="size-8 animate-spin rounded-full border-4 border-neutral-200 border-t-brand-600" />
                    </div>
                )}

                {!isLoading && hasSearched && results.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <SearchLg className="mb-3 size-12 text-neutral-300" />
                        <p className="text-sm font-medium text-primary">
                            No encontramos resultados
                        </p>
                        <p className="mt-1 text-xs text-tertiary">
                            Intenta con otra búsqueda o aumenta la distancia
                        </p>
                    </div>
                )}

                {!isLoading && results.length > 0 && (
                    <div className="flex flex-col gap-3">
                        {results.map((gig) => (
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

                {!hasSearched && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <SearchLg className="mb-3 size-12 text-neutral-200" />
                        <p className="text-sm text-tertiary">
                            Busca servicios cerca de ti
                        </p>
                    </div>
                )}
            </section>
        </div>
    );
}
