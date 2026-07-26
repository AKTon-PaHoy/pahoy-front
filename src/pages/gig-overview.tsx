import { useCallback, useEffect, useState } from "react";
import {
    ChevronLeft,
    ChevronRight,
    InfoCircle,
    Star01,
    ShieldTick,
    MessageChatCircle,
    MarkerPin01,
    XClose,
} from "@untitledui/icons";
import { AnimatePresence, motion } from "motion/react";
import { useNavigate, useParams } from "react-router";

import { Carousel } from "@/components/application/carousel/carousel-base";
import { Button } from "@/components/base/buttons/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useReverseGeocode } from "@/hooks/use-reverse-geocode";
import { api, ApiError } from "@/utils/api";
import { formatCoordinates, fromGeoJSON } from "@/utils/coordinates";

// --- Types ---

interface TalentInfo {
    first_name: string | null;
    last_name: string | null;
    bio: string | null;
    profile_pic: string | null;
    location: { type: string; coordinates: [number, number] } | null;
}

interface Gig {
    id: string;
    talent: string;
    name: string;
    description: string;
    gig_front_img?: string | null;
    gig_secong_img?: string | null;
    gig_third_img?: string | null;
    price: number;
    is_active: boolean;
    tags: unknown;
    created_at: string;
    updated_at: string;
    price_type: "Fijo" | "Horas";
    talent_info: TalentInfo;
}

interface Review {
    id: string;
    contract_id: string;
    gig_name: string;
    client_name: string;
    talent_name: string;
    client_review: string;
    client_satisfaction: number | null;
    talent_review: string;
    talent_satisfaction: number | null;
}

// --- Component ---

export function GigOverview() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { user: currentUser, isLoading: isLoadingUser } = useCurrentUser();

    const [gig, setGig] = useState<Gig | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    // Room creation state
    const [isCreatingRoom, setIsCreatingRoom] = useState(false);
    const [roomCreationError, setRoomCreationError] = useState<string | null>(null);

    const fetchGig = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const [gigData, reviewData] = await Promise.all([
                api<Gig>(`/api/gigs/retrieve/${id}/`),
                api<{ results: Review[] }>(`/api/reviews/list/?gig=${id}`),
            ]);
            setGig(gigData);
            setReviews(reviewData.results);
        } catch {
            setError(true);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchGig();
    }, [fetchGig]);

    // Handle "Chatear" button tap to create room
    const handleCreateRoom = useCallback(async () => {
        if (!id || isCreatingRoom) return;

        setIsCreatingRoom(true);
        setRoomCreationError(null);

        const timeoutId = setTimeout(() => {
            if (isCreatingRoom) {
                setIsCreatingRoom(false);
                setRoomCreationError("Tiempo de espera agotado. Intenta de nuevo.");
            }
        }, 15000); // 15-second timeout

        try {
            interface ChatRoom {
                id: string;
            }

            const room = await api<ChatRoom>("/api/chat/rooms/create/", {
                method: "POST",
                body: { gig: id },
            });

            clearTimeout(timeoutId);

            // Navigate to conversation view
            if (room && room.id) {
                navigate(`/messages/${room.id}`);
            }
        } catch (err) {
            clearTimeout(timeoutId);
            setIsCreatingRoom(false);

            if (err instanceof ApiError) {
                if (err.status === 400) {
                    setRoomCreationError("No se pudo crear la sala de chat. Intenta de nuevo.");
                } else {
                    // Network or 5xx error
                    setRoomCreationError("Error de conexión. Intenta de nuevo.");
                }
            } else {
                setRoomCreationError("Error de conexión. Intenta de nuevo.");
            }
        }
    }, [id, isCreatingRoom, navigate]);

    // Collect all images for the carousel
    const images: string[] = [];
    if (gig?.gig_front_img) images.push(gig.gig_front_img);
    if (gig?.gig_secong_img) images.push(gig.gig_secong_img);
    if (gig?.gig_third_img) images.push(gig.gig_third_img);

    // Calculate average rating from reviews
    const ratings = reviews
        .map((r) => r.client_satisfaction)
        .filter((r): r is number => r != null);
    const avgRating =
        ratings.length > 0
            ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
            : null;

    if (isLoading) {
        return (
            <div className="flex min-h-dvh items-center justify-center bg-white">
                <div className="size-8 animate-spin rounded-full border-4 border-neutral-200 border-t-brand-600" />
            </div>
        );
    }

    if (error || !gig) {
        return (
            <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-4">
                <p className="text-sm text-tertiary">
                    No pudimos cargar este servicio
                </p>
                <Button
                    color="primary"
                    size="md"
                    className="mt-4"
                    onClick={() => navigate(-1)}
                >
                    Volver
                </Button>
            </div>
        );
    }

    return (
        <div className="flex min-h-dvh flex-col bg-white">
            {/* Header */}
            <header className="flex items-center justify-between px-4 pt-4 pb-2">
                <button
                    onClick={() => navigate(-1)}
                    className="flex size-10 items-center justify-center rounded-lg text-neutral-500"
                    aria-label="Volver"
                >
                    <ChevronLeft className="size-6" />
                </button>
                <img src="/thunderface.png" alt="Pa·Hoy" className="h-8" />
                <button
                    className="flex size-10 items-center justify-center rounded-lg text-neutral-500"
                    aria-label="Información"
                >
                    <InfoCircle className="size-6" />
                </button>
            </header>

            {/* Divider */}
            <div className="h-px bg-neutral-100" />

            {/* Image Carousel */}
            <section className="bg-neutral-50 px-4 py-4">
                {images.length > 0 ? (
                    <Carousel.Root
                        opts={{ loop: true }}
                        className="w-full"
                    >
                        <div className="relative overflow-hidden rounded-2xl">
                            <Carousel.Content className="h-56">
                                {images.map((img, idx) => (
                                    <Carousel.Item key={idx} className="h-56">
                                        <button
                                            type="button"
                                            className="size-full cursor-zoom-in"
                                            onClick={() => setLightboxIndex(idx)}
                                            aria-label={`Ver imagen ${idx + 1} en pantalla completa`}
                                        >
                                            <img
                                                src={img}
                                                alt={`${gig.name} - imagen ${idx + 1}`}
                                                className="size-full object-cover"
                                            />
                                        </button>
                                    </Carousel.Item>
                                ))}
                            </Carousel.Content>
                            {images.length > 1 && (
                                <>
                                    <Carousel.PrevTrigger className="absolute left-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-sm">
                                        <ChevronLeft className="size-4 text-neutral-700" />
                                    </Carousel.PrevTrigger>
                                    <Carousel.NextTrigger className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-sm">
                                        <ChevronRight className="size-4 text-neutral-700" />
                                    </Carousel.NextTrigger>
                                </>
                            )}
                        </div>
                        {images.length > 1 && (
                            <Carousel.IndicatorGroup className="mt-3 flex justify-center gap-1.5">
                                {({ index }: { index: number }) => (
                                    <Carousel.Indicator
                                        key={index}
                                        index={index}
                                        className={({ isSelected }) =>
                                            `size-2 rounded-full transition-colors ${
                                                isSelected
                                                    ? "bg-brand-600"
                                                    : "bg-neutral-300"
                                            }`
                                        }
                                    />
                                )}
                            </Carousel.IndicatorGroup>
                        )}
                    </Carousel.Root>
                ) : (
                    <div className="h-56 rounded-2xl bg-neutral-100" />
                )}
            </section>

            {/* Content */}
            <motion.div
                className="flex flex-1 flex-col px-4 pt-5 pb-8"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
            >
                {/* Gig Name */}
                <h1 className="text-lg font-bold text-primary">
                    {gig.name}
                </h1>

                {/* Rating & Price row */}
                <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        {avgRating && (
                            <>
                                <Star01 className="size-4 fill-amber-400 text-amber-400" />
                                <span className="text-sm font-medium text-primary">
                                    {avgRating}
                                </span>
                                <span className="text-sm text-tertiary">
                                    · {ratings.length}{" "}
                                    {ratings.length === 1 ? "reseña" : "reseñas"}
                                </span>
                            </>
                        )}
                    </div>
                    <div className="shrink-0">
                        <span className="text-xl font-bold text-brand-600">
                            ${gig.price}
                        </span>
                        <span className="text-sm text-tertiary">
                            {" "}/ {gig.price_type === "Horas" ? "hora" : "serv"}
                        </span>
                    </div>
                </div>

                {/* Talent Card */}
                <div className="mt-5">
                    <TalentCard talentInfo={gig.talent_info} />
                </div>

                {/* Divider */}
                <div className="my-5 h-px bg-neutral-200" />

                {/* Description */}
                <div>
                    <h2 className="text-base font-bold text-primary">
                        Sobre este servicio
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-secondary">
                        {gig.description}
                    </p>
                </div>

                {/* Tags */}
                {Array.isArray(gig.tags) && gig.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {(gig.tags as string[]).map((tag, idx) => (
                            <span
                                key={idx}
                                className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Divider */}
                <div className="my-5 h-px bg-neutral-200" />

                {/* Reviews Section */}
                <section>
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-primary">
                            Lo que dicen los vecinos
                        </h2>
                        {reviews.length > 0 && (
                            <button className="text-sm font-semibold text-brand-600">
                                Ver todo
                            </button>
                        )}
                    </div>

                    {reviews.length === 0 ? (
                        <p className="mt-3 text-sm text-tertiary">
                            Aún no hay reseñas para este servicio
                        </p>
                    ) : (
                        <div className="mt-4 flex flex-col gap-4">
                            {reviews.slice(0, 3).map((review) => (
                                <ReviewCard key={review.id} review={review} />
                            ))}
                        </div>
                    )}
                </section>

                {/* Bottom spacing for CTA */}
                <div className="h-24" />
            </motion.div>

            {/* Fixed Bottom CTA - Always visible */}
            <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[750px] bg-white px-4 pt-3 pb-safe">
                <div className="pb-4">
                    <button
                        onClick={() => {
                            if (!currentUser) {
                                // User not logged in: navigate to login
                                navigate("/login");
                            } else if (currentUser.id === gig.talent) {
                                // User is gig owner: button is disabled, do nothing
                            } else {
                                // User is logged in and not owner: create chat room
                                handleCreateRoom();
                            }
                        }}
                        disabled={
                            isLoadingUser ||
                            isCreatingRoom ||
                            (currentUser ? currentUser.id === gig.talent : false)
                        }
                        className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 shadow-sm transition-colors ${
                            isLoadingUser || !currentUser || currentUser.id === gig.talent
                                ? "cursor-not-allowed bg-neutral-200 text-neutral-600"
                                : isCreatingRoom
                                  ? "cursor-wait bg-brand-600/80 text-white"
                                  : "active:bg-brand-700 bg-brand-600 text-white"
                        }`}
                    >
                        {isLoadingUser ? (
                            <>
                                <div className="size-5 animate-spin rounded-full border-2 border-neutral-600/30 border-t-neutral-600" />
                                <span className="text-base font-semibold">Cargando...</span>
                            </>
                        ) : isCreatingRoom ? (
                            <>
                                <div className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                <span className="text-base font-semibold">Creando sala...</span>
                            </>
                        ) : !currentUser ? (
                            <>
                                <MessageChatCircle className="size-5" />
                                <span className="text-base font-semibold">
                                    Inicia sesión para chatear
                                </span>
                            </>
                        ) : currentUser.id === gig.talent ? (
                            <>
                                <MessageChatCircle className="size-5" />
                                <span className="text-base font-semibold">
                                    No puedes chatear contigo mismo
                                </span>
                            </>
                        ) : (
                            <>
                                <MessageChatCircle className="size-5" />
                                <span className="text-base font-semibold">Chatear</span>
                            </>
                        )}
                    </button>

                    {/* Error message */}
                    {roomCreationError && (
                        <p className="mt-3 text-center text-sm text-error-primary">
                            {roomCreationError}
                        </p>
                    )}
                </div>
            </div>

            {/* Fullscreen Lightbox */}
            <ImageLightbox
                images={images}
                initialIndex={lightboxIndex}
                onClose={() => setLightboxIndex(null)}
            />
        </div>
    );
}

// --- Image Lightbox Sub-component ---

function ImageLightbox({
    images,
    initialIndex,
    onClose,
}: {
    images: string[];
    initialIndex: number | null;
    onClose: () => void;
}) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (initialIndex !== null) {
            setCurrentIndex(initialIndex);
        }
    }, [initialIndex]);

    // Lock body scroll when lightbox is open
    useEffect(() => {
        if (initialIndex !== null) {
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = "";
            };
        }
    }, [initialIndex]);

    // Keyboard navigation
    useEffect(() => {
        if (initialIndex === null) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowLeft") setCurrentIndex((i) => (i - 1 + images.length) % images.length);
            if (e.key === "ArrowRight") setCurrentIndex((i) => (i + 1) % images.length);
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [initialIndex, images.length, onClose]);

    return (
        <AnimatePresence>
            {initialIndex !== null && (
                <motion.div
                    className="fixed inset-0 z-50 flex flex-col bg-black"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 pt-4 pb-2">
                        <span className="text-sm text-white/70">
                            {currentIndex + 1} / {images.length}
                        </span>
                        <button
                            onClick={onClose}
                            className="flex size-10 items-center justify-center rounded-full text-white"
                            aria-label="Cerrar"
                        >
                            <XClose className="size-6" />
                        </button>
                    </div>

                    {/* Image */}
                    <div className="flex flex-1 items-center justify-center px-4">
                        <motion.img
                            key={currentIndex}
                            src={images[currentIndex]}
                            alt={`Imagen ${currentIndex + 1}`}
                            className="max-h-full max-w-full object-contain"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2 }}
                        />
                    </div>

                    {/* Navigation arrows */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={() => setCurrentIndex((i) => (i - 1 + images.length) % images.length)}
                                className="absolute left-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm"
                                aria-label="Imagen anterior"
                            >
                                <ChevronLeft className="size-5" />
                            </button>
                            <button
                                onClick={() => setCurrentIndex((i) => (i + 1) % images.length)}
                                className="absolute right-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm"
                                aria-label="Imagen siguiente"
                            >
                                <ChevronRight className="size-5" />
                            </button>
                        </>
                    )}

                    {/* Dots */}
                    {images.length > 1 && (
                        <div className="flex justify-center gap-1.5 pb-8 pt-4">
                            {images.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentIndex(idx)}
                                    className={`size-2 rounded-full transition-colors ${
                                        idx === currentIndex ? "bg-white" : "bg-white/40"
                                    }`}
                                    aria-label={`Ir a imagen ${idx + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// --- Talent Card Sub-component ---

function TalentCard({ talentInfo }: { talentInfo: TalentInfo }) {
    const displayName = [talentInfo.first_name, talentInfo.last_name]
        .filter(Boolean)
        .join(" ") || "Talento verificado";

    const coordinates = fromGeoJSON(talentInfo.location);
    const { address, error: geocodeError } = useReverseGeocode(coordinates);

    // Show a compact location: pick 2 relevant segments
    const shortAddress = (() => {
        if (!address) return null;
        const parts = address.split(",").map((s) => s.trim());
        const candidates = parts.slice(1).filter((part, i, arr) => {
            return !arr
                .slice(0, i)
                .some((prev) => prev.includes(part) || part.includes(prev));
        });
        return candidates.slice(0, 2).join(", ") || parts.slice(0, 2).join(", ");
    })();

    const displayLocation = shortAddress ?? (geocodeError && coordinates ? formatCoordinates(coordinates.latitude, coordinates.longitude) : null);

    return (
        <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            {/* Avatar */}
            <div className="size-12 shrink-0 overflow-hidden rounded-full bg-brand-100">
                <img
                    src={talentInfo.profile_pic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`}
                    alt={displayName}
                    className="size-full object-cover"
                />
            </div>

            {/* Info */}
            <div className="flex-1">
                <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-primary">
                        {displayName}
                    </span>
                    <ShieldTick className="size-4 text-brand-600" />
                </div>
                {talentInfo.bio && (
                    <p className="mt-0.5 text-xs text-tertiary">
                        {talentInfo.bio}
                    </p>
                )}
                <div className="mt-1 flex items-center gap-1 text-xs text-tertiary">
                    <MarkerPin01 className="size-3 text-brand-600" />
                    <span>{displayLocation || "Cerca de ti"}</span>
                </div>
            </div>
        </div>
    );
}

// --- Review Card Sub-component ---

function ReviewCard({ review }: { review: Review }) {
    return (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            {/* Header: avatar + name + rating */}
            <div className="flex items-center gap-3">
                <div className="size-10 shrink-0 overflow-hidden rounded-full bg-neutral-100">
                    <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(review.client_name)}`}
                        alt={review.client_name}
                        className="size-full object-cover"
                    />
                </div>
                <div className="flex-1">
                    <span className="text-sm font-semibold text-primary">
                        {review.client_name}
                    </span>
                    {review.client_satisfaction != null && (
                        <div className="mt-0.5 flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star01
                                    key={i}
                                    className={`size-3.5 ${
                                        i < review.client_satisfaction!
                                            ? "fill-amber-400 text-amber-400"
                                            : "fill-neutral-200 text-neutral-200"
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Review text */}
            {review.client_review && (
                <p className="mt-3 text-sm leading-relaxed text-secondary">
                    {review.client_review}
                </p>
            )}
        </div>
    );
}
