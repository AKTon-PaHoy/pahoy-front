import { useState } from "react";
import { CheckCircle, ChevronLeft, Star01 } from "@untitledui/icons";
import { motion } from "motion/react";
import { useNavigate, useParams } from "react-router";

import { LoadingIndicator } from "@/components/application/loading-indicator/loading-indicator";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { useContractDetail } from "@/hooks/use-contract-detail";
import { api, ApiError } from "@/utils/api";

const STATUS_COLOR_MAP: Record<string, "brand" | "success" | "warning" | "error" | "gray"> = {
    Propuesta: "brand",
    Activo: "success",
    Confirmado: "blue" as "brand",
    Concluido: "gray",
    Cancelado: "error",
    Disputa: "warning",
};

export function ContractConfirmationPage() {
    const { contractId } = useParams<{ contractId: string }>();
    const navigate = useNavigate();
    const { contract, gig, isLoading, error } = useContractDetail(contractId!);

    const [isAccepting, setIsAccepting] = useState(false);
    const [acceptError, setAcceptError] = useState<string | null>(null);

    const handleAccept = async () => {
        setIsAccepting(true);
        setAcceptError(null);
        try {
            await api(`/api/contracts/accept/${contractId}/`, { method: "PATCH" });
            navigate(`/contracts/${contractId}`, { replace: true });
        } catch (err) {
            if (err instanceof ApiError) {
                const detail =
                    err.fieldErrors._general?.[0] || err.fieldErrors.detail?.[0] || "Error al aceptar el contrato";
                setAcceptError(detail);
            } else {
                setAcceptError("Error de conexión");
            }
        } finally {
            setIsAccepting(false);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="flex min-h-dvh items-center justify-center bg-white">
                <LoadingIndicator size="md" />
            </div>
        );
    }

    // Error state (404)
    if (error) {
        return (
            <div className="flex min-h-dvh flex-col bg-white">
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex size-10 items-center justify-center rounded-lg text-neutral-500"
                    >
                        <ChevronLeft className="size-6" />
                    </button>
                    <h1 className="text-base font-semibold text-primary">Confirmar Contratación</h1>
                    <div className="size-10" />
                </div>
                <div className="flex flex-1 flex-col items-center justify-center px-4">
                    <p className="text-sm text-tertiary">{error}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="mt-4 text-sm font-semibold text-brand-600"
                    >
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    const talentFirstName = gig?.talent_info?.first_name || "este talento";
    const statusColor = STATUS_COLOR_MAP[contract?.status || ""] || "gray";

    return (
        <div className="flex min-h-dvh flex-col bg-white">
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <button
                    onClick={() => navigate(-1)}
                    className="flex size-10 items-center justify-center rounded-lg text-neutral-500"
                >
                    <ChevronLeft className="size-6" />
                </button>
                <h1 className="text-base font-semibold text-primary">Confirmar Contratación</h1>
                <div className="size-10" />
            </div>

            {/* Content */}
            <motion.div
                className="flex flex-1 flex-col px-4 pt-4"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
            >
                {/* Gig image */}
                {gig?.front_image && (
                    <img
                        src={gig.front_image}
                        alt={gig.name}
                        className="aspect-video w-full rounded-xl object-cover"
                    />
                )}

                {/* Gig name */}
                <h2 className="mt-4 text-lg font-semibold text-primary">{gig?.name}</h2>

                {/* Talent name + verified badge */}
                <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-sm text-tertiary">
                        {gig?.talent_info?.first_name} {gig?.talent_info?.last_name}
                    </span>
                    {gig?.talent_info?.is_verified && (
                        <span className="flex size-4 items-center justify-center rounded-full bg-brand-600 text-[8px] font-bold text-white">
                            ✓
                        </span>
                    )}
                </div>

                {/* Rating */}
                {gig?.talent_info?.rating != null && (
                    <div className="mt-1.5 flex items-center gap-1">
                        <Star01 className="size-4 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-medium text-primary">
                            {gig.talent_info.rating.toFixed(1)}
                        </span>
                    </div>
                )}

                {/* Price + price type */}
                <div className="mt-4 flex items-center gap-2">
                    <span className="text-lg font-bold text-primary">
                        ${contract?.price?.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-sm text-tertiary">{contract?.price_type}</span>
                </div>

                {/* Status badge */}
                <div className="mt-3">
                    <Badge size="sm" color={statusColor}>
                        {contract?.status}
                    </Badge>
                </div>
            </motion.div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Bottom CTA */}
            <div className="px-4 pb-6 pt-4">
                <Button
                    type="button"
                    color="primary"
                    size="xl"
                    className="w-full"
                    isLoading={isAccepting}
                    showTextWhileLoading
                    isDisabled={isAccepting}
                    iconLeading={CheckCircle}
                    onClick={handleAccept}
                >
                    {isAccepting ? "Confirmando..." : `Sí, contratar a ${talentFirstName}`}
                </Button>

                {/* Accept error */}
                {acceptError && (
                    <p className="mt-3 text-center text-sm text-error-primary">{acceptError}</p>
                )}
            </div>
        </div>
    );
}
