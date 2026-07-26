import { useNavigate, useParams } from "react-router";
import { AlertCircle, ChevronLeft } from "@untitledui/icons";
import { motion } from "motion/react";

import { LoadingIndicator } from "@/components/application/loading-indicator/loading-indicator";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { useContractDetail } from "@/hooks/use-contract-detail";
import { useCurrentUser } from "@/hooks/use-current-user";
import { CONTRACT_TIMELINE_STEPS } from "@/types/chat";
import { cx } from "@/utils/cx";

const getStatusColor = (status: string) => {
    switch (status) {
        case "Activo":
            return "brand";
        case "Confirmado":
            return "success";
        case "Propuesta":
            return "warning";
        case "Concluido":
            return "gray";
        case "Disputa":
            return "error";
        case "Cancelado":
            return "error";
        default:
            return "gray";
    }
};

const getCompletedStepIndex = (status: string): number => {
    const statusOrder = ["Propuesta", "Activo", "Confirmado", "Concluido"];
    return statusOrder.indexOf(status);
};

const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-MX", {
        weekday: "long",
        day: "numeric",
        month: "long",
    });
};

export function ContractDetailPage() {
    const { contractId } = useParams<{ contractId: string }>();
    const navigate = useNavigate();
    const { contract, gig, isLoading, error } = useContractDetail(contractId!);
    const { user: currentUser } = useCurrentUser();

    if (isLoading) {
        return (
            <div className="flex min-h-dvh items-center justify-center bg-white">
                <LoadingIndicator size="md" />
            </div>
        );
    }

    if (error || !contract) {
        return (
            <div className="flex min-h-dvh flex-col bg-white">
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                    <button type="button" onClick={() => navigate(-1)} className="size-10 rounded-lg text-neutral-500">
                        <ChevronLeft className="size-6" />
                    </button>
                    <span className="text-sm font-semibold text-primary">Detalle de contratación</span>
                    <div className="size-10" />
                </div>
                <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4">
                    <AlertCircle className="size-10 text-fg-error-secondary" />
                    <p className="text-center text-sm text-tertiary">{error ?? "Contrato no encontrado"}</p>
                    <Button color="secondary" size="md" onClick={() => navigate(-1)}>
                        Volver
                    </Button>
                </div>
            </div>
        );
    }

    const completedIndex = getCompletedStepIndex(contract.status);
    const isCancelledOrDisputed = contract.status === "Cancelado" || contract.status === "Disputa";
    const isGigOwner = currentUser && gig ? (currentUser.id === gig.talent || currentUser.profileId === gig.talent) : false;
    const showCancelButton = isGigOwner && (contract.status === "Activo" || contract.status === "Confirmado");

    return (
        <div className="flex min-h-dvh flex-col bg-white">
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <button type="button" onClick={() => navigate(-1)} className="size-10 rounded-lg text-neutral-500">
                    <ChevronLeft className="size-6" />
                </button>
                <span className="text-sm font-semibold text-primary">Detalle de contratación</span>
                <div className="size-10" />
            </div>

            {/* Content */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex flex-1 flex-col px-4 pb-6"
            >
                {/* Status Badge */}
                <div className="mt-4">
                    <Badge type="pill-color" size="sm" color={getStatusColor(contract.status)}>
                        {contract.status}
                    </Badge>
                </div>

                {/* Price + Price Type */}
                <div className="mt-4">
                    {contract.price !== null && (
                        <p className="text-display-xs font-bold text-primary">
                            ${contract.price.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    )}
                    <p className="mt-0.5 text-sm text-tertiary">{contract.price_type}</p>
                </div>

                {/* Timeline */}
                <div className="mt-6">
                    <h3 className="mb-3 text-sm font-medium text-secondary">Progreso</h3>
                    {isCancelledOrDisputed ? (
                        <div className="flex items-center gap-3">
                            <div className="flex size-3 items-center justify-center rounded-full border-2 border-error-500 bg-error-500" />
                            <span className="text-sm font-medium text-error-primary">
                                {contract.status === "Cancelado" ? "Contrato cancelado" : "En disputa"}
                            </span>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-0">
                            {CONTRACT_TIMELINE_STEPS.map((step, index) => {
                                const isComplete = index <= completedIndex;
                                return (
                                    <div key={step.key} className="flex items-start gap-3">
                                        {/* Dot + line */}
                                        <div className="flex flex-col items-center">
                                            <div
                                                className={cx(
                                                    "size-3 rounded-full border-2",
                                                    isComplete ? "border-brand-600 bg-brand-600" : "border-neutral-300 bg-white",
                                                )}
                                            />
                                            {index < CONTRACT_TIMELINE_STEPS.length - 1 && (
                                                <div className={cx("h-6 w-0.5", isComplete ? "bg-brand-600" : "bg-neutral-200")} />
                                            )}
                                        </div>
                                        {/* Label */}
                                        <span className={cx("text-sm -mt-0.5", isComplete ? "font-medium text-primary" : "text-tertiary")}>
                                            {step.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Participantes */}
                <div className="mt-6">
                    <h3 className="mb-3 text-sm font-medium text-secondary">Participantes</h3>
                    <div className="flex flex-col gap-3">
                        {/* Talent */}
                        <div className="flex items-center gap-3">
                            {gig?.talent_info.profile_picture ? (
                                <img
                                    src={gig.talent_info.profile_picture}
                                    alt={contract.talent_username || "Talento"}
                                    className="size-10 rounded-full object-cover"
                                />
                            ) : (
                                <div className="flex size-10 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold text-tertiary">
                                    {(contract.talent_username?.[0] || "T").toUpperCase()}
                                </div>
                            )}
                            <div className="flex flex-1 flex-col">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-medium text-primary">
                                        {gig ? `${gig.talent_info.first_name} ${gig.talent_info.last_name}` : contract.talent_username || "Talento"}
                                    </span>
                                    {gig?.talent_info.is_verified && (
                                        <span className="flex size-5 items-center justify-center rounded-full bg-brand-600 text-[9px] font-bold text-white">
                                            ✓
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs text-tertiary">
                                    Talento{contract.talent_username ? ` · @${contract.talent_username}` : ""}
                                </span>
                            </div>
                        </div>

                        {/* Client */}
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold text-tertiary">
                                {(contract.client_username?.[0] || "C").toUpperCase()}
                            </div>
                            <div className="flex flex-1 flex-col">
                                <span className="text-sm font-medium text-primary">
                                    {contract.client_username || "Cliente"}
                                </span>
                                <span className="text-xs text-tertiary">
                                    Cliente{contract.client_username ? ` · @${contract.client_username}` : ""}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Gig Info */}
                {gig && (
                    <div className="mt-6">
                        <h3 className="mb-2 text-sm font-medium text-secondary">Servicio</h3>
                        <p className="text-sm font-medium text-primary">{gig.name}</p>
                        {gig.description && (
                            <p className="mt-0.5 text-sm text-tertiary">{gig.description}</p>
                        )}
                    </div>
                )}

                {/* Dates */}
                <div className="mt-6">
                    <h3 className="mb-2 text-sm font-medium text-secondary">Fechas</h3>
                    <div className="flex flex-col gap-1">
                        <p className="text-sm text-tertiary">
                            <span className="font-medium text-primary">Creado:</span> {formatDate(contract.created_at)}
                        </p>
                        <p className="text-sm text-tertiary">
                            <span className="font-medium text-primary">Actualizado:</span> {formatDate(contract.updated_at)}
                        </p>
                    </div>
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Cancel Button */}
                {showCancelButton && (
                    <div className="mt-6 pt-4">
                        <Button color="secondary-destructive" size="lg" className="w-full">
                            Cancelar contratación
                        </Button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
