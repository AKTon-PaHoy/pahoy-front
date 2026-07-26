import { Star01 } from "@untitledui/icons";
import { useNavigate } from "react-router";

import { Button } from "@/components/base/buttons/button";
import { Toggle } from "@/components/base/toggle/toggle";

export interface ServiceCardProps {
    /** Gig ID for navigation */
    gigId?: string;
    /** Service/gig name */
    name: string;
    /** Rating value (e.g., 4.8) */
    rating?: number;
    /** Number of reviews */
    reviewCount?: number;
    /** Provider name */
    providerName: string;
    /** Whether the provider is verified */
    isVerified?: boolean;
    /** Starting price */
    price: number;
    /** Price type — when "Horas" renders "$price/hr", otherwise "Desde $price" */
    priceType?: "Fijo" | "Horas";
    /** Image URL for the service */
    imageUrl?: string;
    /** Optional active/inactive status indicator for Chambas context */
    status?: "active" | "inactive";
    /** Callback when toggle is changed (Chambas context) */
    onToggleStatus?: (isActive: boolean) => void;
    /** Callback when "Ver más" is clicked */
    onViewMore?: () => void;
}

export function ServiceCard({
    gigId,
    name,
    rating,
    reviewCount,
    providerName,
    isVerified = false,
    price,
    priceType,
    imageUrl,
    status,
    onToggleStatus,
    onViewMore,
}: ServiceCardProps) {
    const navigate = useNavigate();

    const handleViewMore = () => {
        if (onViewMore) {
            onViewMore();
        } else if (gigId) {
            navigate(`/gig/${gigId}`);
        }
    };

    const formattedPrice =
        price % 1 === 0 ? `$${price.toLocaleString()}` : `$${price.toLocaleString()}`;

    const cardContent = (
        <>
            {/* Image */}
            <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={name}
                        className="size-full object-cover"
                    />
                ) : (
                    <div className="size-full bg-neutral-200" />
                )}
            </div>

            {/* Content */}
            <div className="flex min-w-0 flex-1 flex-col justify-between gap-1">
                <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-primary">
                        {name}
                    </h3>

                    {/* Price line */}
                    <p className="mt-0.5 text-xs text-tertiary">
                        {priceType === "Horas" ? (
                            <>
                                <span className="font-semibold text-primary">
                                    {formattedPrice}
                                </span>
                                {" "}por hora
                            </>
                        ) : (
                            <>
                                <span className="font-semibold text-primary">
                                    {formattedPrice}
                                </span>
                                {" "}por servicio
                            </>
                        )}
                    </p>

                    {/* Provider */}
                    {!status && (
                        <div className="mt-0.5 flex items-center gap-1">
                            <span className="text-xs text-tertiary">
                                {providerName}
                            </span>
                            {isVerified && (
                                <span className="flex size-3.5 items-center justify-center rounded-full bg-brand-600 text-[8px] font-bold text-white">
                                    ✓
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Rating */}
                {rating != null && (
                    <div className="flex items-center gap-1">
                        <Star01 className="size-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs text-tertiary">
                            {rating}
                            {reviewCount != null && (
                                <> · {reviewCount} reseñas</>
                            )}
                        </span>
                    </div>
                )}

                {/* CTA button (non-Chambas context) */}
                {!status && (
                    <div className="mt-1 flex items-center justify-between">
                        <span className="text-sm text-tertiary">
                            {priceType === "Horas" ? (
                                <>
                                    Desde{" "}
                                    <span className="font-bold text-primary">
                                        {formattedPrice}
                                    </span>
                                </>
                            ) : (
                                <>
                                    Desde{" "}
                                    <span className="font-bold text-primary">
                                        {formattedPrice}
                                    </span>
                                </>
                            )}
                        </span>
                        <Button
                            color="primary"
                            size="xs"
                            onClick={handleViewMore}
                        >
                            Ver más
                        </Button>
                    </div>
                )}
            </div>

            {/* Toggle — top-right for Chambas context */}
            {status && (
                <div
                    className="shrink-0 self-start"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Toggle
                        size="sm"
                        isSelected={status === "active"}
                        onChange={(isSelected) =>
                            onToggleStatus?.(isSelected)
                        }
                        aria-label={`Estado: ${status === "active" ? "Activa" : "Inactiva"}`}
                    />
                </div>
            )}
        </>
    );

    // In Chambas context, the whole card is tappable for navigation
    if (status && gigId) {
        return (
            <button
                type="button"
                onClick={handleViewMore}
                className="flex gap-3 rounded-2xl border border-neutral-200 bg-white p-3 text-left shadow-xs transition-colors active:bg-neutral-50"
            >
                {cardContent}
            </button>
        );
    }

    return (
        <div className="flex gap-3 rounded-2xl border border-neutral-200 bg-white p-3 shadow-xs">
            {cardContent}
        </div>
    );
}
