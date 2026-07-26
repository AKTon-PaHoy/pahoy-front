import { useCallback, useEffect, useRef, useState } from "react";
import { Clock, CheckCircle } from "@untitledui/icons";
import { motion } from "motion/react";
import { useNavigate } from "react-router";

import { LoadingIndicator } from "@/components/application/loading-indicator/loading-indicator";
import { Tabs } from "@/components/application/tabs/tabs";
import { Button } from "@/components/base/buttons/button";
import { useContractsList } from "@/hooks/use-contracts-list";
import type { ContractListItem } from "@/types/chat";

/** Format a price as currency (e.g., "$1,500") */
function formatPrice(price: number): string {
    return `$${price.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/** Format updated_at as a relative date label (e.g., "Hoy, 2:30 pm", "Mañana, 8:30 am") */
function formatRelativeDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const timeStr = date.toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit", hour12: true });

    if (diffDays === 0) return `Hoy, ${timeStr}`;
    if (diffDays === 1) return `Mañana, ${timeStr}`;
    if (diffDays === -1) return `Ayer, ${timeStr}`;

    const dayName = date.toLocaleDateString("es-MX", { weekday: "long" });
    return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)}, ${timeStr}`;
}

/** Skeleton loading card for contract items */
function SkeletonCard() {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-neutral-200 p-3">
            <div className="size-16 shrink-0 animate-pulse rounded-lg bg-neutral-200" />
            <div className="flex flex-1 flex-col gap-2">
                <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-200" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-neutral-200" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-neutral-200" />
            </div>
            <div className="h-5 w-10 animate-pulse rounded bg-neutral-200" />
        </div>
    );
}

/** Contract card item component */
function ContractItem({
    contract,
    tab,
    onClick,
}: {
    contract: ContractListItem;
    tab: "en-curso" | "historial";
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full items-center gap-3 rounded-xl border border-neutral-200 p-3 text-left transition-colors hover:bg-neutral-50"
        >
            {/* Gig thumbnail */}
            <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                {contract.gig_front_image ? (
                    <img
                        src={contract.gig_front_image}
                        alt={contract.gig_name}
                        className="size-full object-cover"
                    />
                ) : (
                    <div className="flex size-full items-center justify-center text-neutral-400">
                        <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                <span className="truncate text-sm font-semibold text-primary">
                    {contract.gig_name}
                </span>
                <span className="flex items-center gap-1 text-xs text-secondary">
                    <span className="truncate">{contract.counterparty_name}</span>
                    {contract.counterparty_verified && (
                        <span className="flex size-3.5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[8px] font-bold text-white">
                            ✓
                        </span>
                    )}
                </span>
                <span className="text-xs text-tertiary">
                    {formatRelativeDate(contract.updated_at)}
                </span>
            </div>

            {/* Status icon */}
            <div className="flex shrink-0 flex-col items-end gap-1">
                {tab === "en-curso" ? (
                    <Clock className="size-5 text-brand-600" />
                ) : (
                    <CheckCircle className="size-5 text-neutral-500" />
                )}
                <span className="text-sm font-bold text-brand-600">
                    {formatPrice(contract.price)}
                </span>
            </div>
        </button>
    );
}

export function ContractsListPage() {
    const navigate = useNavigate();
    const [selectedTab, setSelectedTab] = useState<"en-curso" | "historial">("en-curso");
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Always call both hooks (hooks can't be conditional)
    const enCurso = useContractsList(["Activo", "Confirmado"]);
    const historial = useContractsList(["Concluido", "Cancelado"]);

    // Select active data based on tab
    const activeData = selectedTab === "en-curso" ? enCurso : historial;
    const { contracts, isLoading, error, hasMore, loadMore, retry } = activeData;

    // Infinite scroll handler
    const handleScroll = useCallback(() => {
        const container = scrollContainerRef.current;
        if (!container || !hasMore || isLoading) return;

        const { scrollHeight, scrollTop, clientHeight } = container;
        if (scrollHeight - scrollTop - clientHeight < 200) {
            loadMore();
        }
    }, [hasMore, isLoading, loadMore]);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        container.addEventListener("scroll", handleScroll);
        return () => container.removeEventListener("scroll", handleScroll);
    }, [handleScroll]);

    const handleContractClick = (contractId: string) => {
        navigate(`/contracts/${contractId}`);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex min-h-dvh flex-col bg-white"
        >
            {/* Header */}
            <div className="px-4 pt-6 pb-4">
                <h1 className="text-center text-display-xs font-bold text-primary">Contratos</h1>
            </div>

            {/* Tabs */}
            <div className="px-4">
                <Tabs
                    selectedKey={selectedTab}
                    onSelectionChange={(key) => setSelectedTab(key as "en-curso" | "historial")}
                >
                    <Tabs.List type="underline" size="sm" fullWidth>
                        <Tabs.Item id="en-curso">En Curso</Tabs.Item>
                        <Tabs.Item id="historial">Historial</Tabs.Item>
                    </Tabs.List>
                </Tabs>
            </div>

            {/* Content area */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 pt-4 pb-4">
                {/* Loading state */}
                {isLoading && (
                    <div className="flex flex-col gap-3">
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </div>
                )}

                {/* Error state */}
                {error && !isLoading && (
                    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                        <p className="text-sm text-error-primary">{error}</p>
                        <Button type="button" color="primary" size="md" onClick={retry}>
                            Reintentar
                        </Button>
                    </div>
                )}

                {/* Empty state */}
                {!isLoading && !error && contracts.length === 0 && (
                    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                        <div className="mb-2 flex size-16 items-center justify-center rounded-full bg-neutral-100">
                            {selectedTab === "en-curso" ? (
                                <Clock className="size-8 text-neutral-400" />
                            ) : (
                                <CheckCircle className="size-8 text-neutral-400" />
                            )}
                        </div>
                        <p className="text-sm font-medium text-secondary">
                            {selectedTab === "en-curso"
                                ? "No tienes contratos en curso"
                                : "No tienes contratos en el historial"}
                        </p>
                        <p className="text-xs text-tertiary">
                            {selectedTab === "en-curso"
                                ? "Tus contratos activos aparecerán aquí"
                                : "Tus contratos finalizados aparecerán aquí"}
                        </p>
                    </div>
                )}

                {/* Contracts list */}
                {!isLoading && !error && contracts.length > 0 && (
                    <div className="flex flex-col gap-3">
                        {contracts.map((contract) => (
                            <ContractItem
                                key={contract.id}
                                contract={contract}
                                tab={selectedTab}
                                onClick={() => handleContractClick(contract.id)}
                            />
                        ))}

                        {/* Loading more indicator */}
                        {hasMore && (
                            <div className="flex justify-center py-4">
                                <LoadingIndicator size="sm" />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
