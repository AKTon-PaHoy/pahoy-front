import { Star01 } from "@untitledui/icons";

import { Button } from "@/components/base/buttons/button";

export interface ServiceCardProps {
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
    /** Image URL for the service */
    imageUrl?: string;
    /** Callback when "Ver más" is clicked */
    onViewMore?: () => void;
}

export function ServiceCard({
    name,
    rating,
    reviewCount,
    providerName,
    isVerified = false,
    price,
    imageUrl,
    onViewMore,
}: ServiceCardProps) {
    return (
        <div className="flex gap-3 rounded-2xl border border-neutral-200 bg-white p-3 shadow-xs">
            {/* Image */}
            <div className="size-24 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
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
            <div className="flex flex-1 flex-col justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-primary line-clamp-2">
                        {name}
                    </h3>

                    {/* Rating */}
                    {rating != null && (
                        <div className="mt-0.5 flex items-center gap-1">
                            <Star01 className="size-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-xs text-tertiary">
                                {rating}
                                {reviewCount != null && (
                                    <> · {reviewCount} reseñas</>
                                )}
                            </span>
                        </div>
                    )}

                    {/* Provider */}
                    <div className="mt-0.5 flex items-center gap-1">
                        <span className="text-xs text-tertiary">
                            {providerName}
                        </span>
                        {isVerified && (
                            <span className="size-3.5 rounded-full bg-brand-600 text-white flex items-center justify-center text-[8px] font-bold">
                                ✓
                            </span>
                        )}
                    </div>
                </div>

                {/* Price + CTA */}
                <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm text-tertiary">
                        Desde{" "}
                        <span className="font-bold text-primary">
                            ${price}
                        </span>
                    </span>
                    <Button
                        color="primary"
                        size="xs"
                        onClick={onViewMore}
                    >
                        Ver más
                    </Button>
                </div>
            </div>
        </div>
    );
}
