import { type FormEvent, useEffect, useRef, useState } from "react";
import { ChevronLeft, Camera01, X } from "@untitledui/icons";
import { motion } from "motion/react";
import { useNavigate } from "react-router";

import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { TextArea } from "@/components/base/textarea/textarea";
import { ImageCropper } from "@/components/application/image-cropper/image-cropper";
import { apiMultipart, ApiError } from "@/utils/api";

interface ImageUploadSlotProps {
    label: string;
    previewUrl: string | null;
    error?: string;
    onClick: () => void;
    onRemove: () => void;
    hasImage: boolean;
}

const DollarIcon = ({ className }: { className?: string }) => (
    <span aria-hidden="true" className={`text-md text-tertiary ${className ?? ""}`}>
        $
    </span>
);

function ImageUploadSlot({ label, previewUrl, error, onClick, onRemove, hasImage }: ImageUploadSlotProps) {
    return (
        <div className="relative min-w-0">
            <button
                type="button"
                onClick={onClick}
                className={`flex aspect-square w-full items-center justify-center rounded-lg border border-dashed bg-primary transition-colors hover:border-brand ${error ? "border-error-primary" : "border-secondary"}`}
                aria-label={`${hasImage ? "Reemplazar" : "Subir"} imagen ${label}`}
            >
                {previewUrl ? (
                    <>
                        <img src={previewUrl} alt={`Imagen ${label}`} className="size-full rounded-lg object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                            <Camera01 className="size-6 text-white" />
                        </div>
                    </>
                ) : (
                    <Camera01 className="size-5 text-tertiary" />
                )}
            </button>

            {hasImage && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-error-primary text-white transition-colors hover:bg-error-subtle"
                    aria-label={`Eliminar imagen ${label}`}
                >
                    <X className="size-3" />
                </button>
            )}

            {error && <p className="mt-2 text-xs text-error-primary">{error}</p>}
        </div>
    );
}

export function NuevaChambaScreen() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form state (Task 2.1)
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [priceType] = useState<"Fijo" | "Horas">("Fijo");
    const [isActive] = useState(true);
    const [tags] = useState("");
    const [errors, setErrors] = useState<{
        name?: string;
        description?: string;
        price?: string;
        priceType?: string;
        isActive?: string;
        tags?: string;
        _general?: string;
    }>({});
    
    // Image upload state (Task 2.2)
    const [frontImage, setFrontImage] = useState<{ blob: Blob | null; previewUrl: string | null; error?: string }>({ blob: null, previewUrl: null });
    const [secondImage, setSecondImage] = useState<{ blob: Blob | null; previewUrl: string | null; error?: string }>({ blob: null, previewUrl: null });
    const [thirdImage, setThirdImage] = useState<{ blob: Blob | null; previewUrl: string | null; error?: string }>({ blob: null, previewUrl: null });
    
    const [cropperImageSrc, setCropperImageSrc] = useState<string | null>(null);
    const [showCropper, setShowCropper] = useState(false);
    const [cropperTarget, setCropperTarget] = useState<'front' | 'second' | 'third' | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Clean up object URLs on unmount
    useEffect(() => {
        return () => {
            if (frontImage.previewUrl) URL.revokeObjectURL(frontImage.previewUrl);
            if (secondImage.previewUrl) URL.revokeObjectURL(secondImage.previewUrl);
            if (thirdImage.previewUrl) URL.revokeObjectURL(thirdImage.previewUrl);
            if (cropperImageSrc) URL.revokeObjectURL(cropperImageSrc);
        };
    }, [frontImage.previewUrl, secondImage.previewUrl, thirdImage.previewUrl, cropperImageSrc]);

    const validateImageDimensions = (file: File): Promise<{ valid: boolean; width: number; height: number }> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const valid = img.width >= 400 && img.width <= 2000 &&
                            img.height >= 400 && img.height <= 2000;
                resolve({ valid, width: img.width, height: img.height });
                URL.revokeObjectURL(img.src);
            };
            img.onerror = () => resolve({ valid: false, width: 0, height: 0 });
            img.src = URL.createObjectURL(file);
        });
    };

    const handleImageSlotClick = (target: 'front' | 'second' | 'third') => {
        setCropperTarget(target);
        fileInputRef.current?.click();
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !cropperTarget) return;

        // Check if file is an image
        if (!file.type.startsWith('image/')) {
            const errorMsg = 'El archivo debe ser una imagen';
            updateImageError(cropperTarget, errorMsg);
            return;
        }

        // Validate dimensions
        const { valid, width, height } = await validateImageDimensions(file);
        if (!valid) {
            const errorMsg = `La imagen debe tener entre 400x400 y 2000x2000 píxeles (actual: ${width}x${height})`;
            updateImageError(cropperTarget, errorMsg);
            return;
        }

        // Clear any previous error
        updateImageError(cropperTarget, undefined);

        // Open cropper
        const objectUrl = URL.createObjectURL(file);
        setCropperImageSrc(objectUrl);
        setShowCropper(true);

        // Reset file input
        e.target.value = "";
    };

    const updateImageError = (target: 'front' | 'second' | 'third', error?: string) => {
        const updateState = (setter: typeof setFrontImage) => {
            setter(prev => ({ ...prev, error }));
        };

        switch (target) {
            case 'front':
                updateState(setFrontImage);
                break;
            case 'second':
                updateState(setSecondImage);
                break;
            case 'third':
                updateState(setThirdImage);
                break;
        }
    };

    const handleCropComplete = (blob: Blob) => {
        if (!cropperTarget) return;

        // Create preview URL
        const previewUrl = URL.createObjectURL(blob);

        // Update the appropriate image state
        switch (cropperTarget) {
            case 'front':
                if (frontImage.previewUrl) URL.revokeObjectURL(frontImage.previewUrl);
                setFrontImage({ blob, previewUrl, error: undefined });
                break;
            case 'second':
                if (secondImage.previewUrl) URL.revokeObjectURL(secondImage.previewUrl);
                setSecondImage({ blob, previewUrl, error: undefined });
                break;
            case 'third':
                if (thirdImage.previewUrl) URL.revokeObjectURL(thirdImage.previewUrl);
                setThirdImage({ blob, previewUrl, error: undefined });
                break;
        }

        setShowCropper(false);
        setCropperImageSrc(null);
        if (cropperImageSrc) URL.revokeObjectURL(cropperImageSrc);
    };

    const handleCropCancel = () => {
        setShowCropper(false);
        setCropperImageSrc(null);
        if (cropperImageSrc) URL.revokeObjectURL(cropperImageSrc);
    };

    const handleRemoveImage = (target: 'front' | 'second' | 'third') => {
        switch (target) {
            case 'front':
                if (frontImage.previewUrl) URL.revokeObjectURL(frontImage.previewUrl);
                setFrontImage({ blob: null, previewUrl: null, error: undefined });
                break;
            case 'second':
                if (secondImage.previewUrl) URL.revokeObjectURL(secondImage.previewUrl);
                setSecondImage({ blob: null, previewUrl: null, error: undefined });
                break;
            case 'third':
                if (thirdImage.previewUrl) URL.revokeObjectURL(thirdImage.previewUrl);
                setThirdImage({ blob: null, previewUrl: null, error: undefined });
                break;
        }
    };

    const validateForm = () => {
        const newErrors: typeof errors = {};

        if (!name.trim()) {
            newErrors.name = "El nombre es requerido";
        }

        if (!description.trim()) {
            newErrors.description = "La descripción es requerida";
        }

        const priceValue = parseFloat(price);
        if (price.trim() === "" || isNaN(priceValue) || priceValue <= 0) {
            newErrors.price = "El precio debe ser mayor a 0";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const buildFormData = (): FormData => {
        const formData = new FormData();
        formData.append("name", name.trim());
        formData.append("description", description.trim());
        formData.append("price", price.trim());
        formData.append("price_type", priceType);
        formData.append("is_active", String(isActive));
        if (tags.trim()) {
            formData.append("tags", tags.trim());
        }
        if (frontImage.blob) {
            formData.append("gig_front_img", frontImage.blob, "front.jpg");
        }
        if (secondImage.blob) {
            formData.append("gig_secong_img", secondImage.blob, "second.jpg");
        }
        if (thirdImage.blob) {
            formData.append("gig_third_img", thirdImage.blob, "third.jpg");
        }
        return formData;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const formData = buildFormData();
            await apiMultipart("/api/gigs/create/", { method: "POST", body: formData });
            navigate("/gigs");
        } catch (err) {
            if (err instanceof ApiError) {
                const newErrors: typeof errors = {};
                const fe = err.fieldErrors;

                if (fe.name) {
                    newErrors.name = fe.name[0];
                }
                if (fe.description) {
                    newErrors.description = fe.description[0];
                }
                if (fe.price) {
                    newErrors.price = fe.price[0];
                }
                if (fe.price_type) {
                    newErrors.priceType = fe.price_type[0];
                }
                if (fe.is_active) {
                    newErrors.isActive = fe.is_active[0];
                }
                if (fe.tags) {
                    newErrors.tags = fe.tags[0];
                }
                if (fe.non_field_errors) {
                    newErrors._general = fe.non_field_errors[0];
                }
                if (fe._general) {
                    newErrors._general = fe._general[0];
                }

                setErrors(newErrors);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-dvh flex-col bg-white">
            {/* Header */}
            <header className="flex shrink-0 items-center justify-between border-b border-secondary px-4 pt-14 pb-2">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex size-10 items-center justify-center rounded-lg text-neutral-500"
                    aria-label="Volver"
                >
                    <ChevronLeft className="size-6" />
                </button>
                <h1 className="pointer-events-none absolute inset-x-0 text-center text-md font-semibold text-primary">
                    Nueva Chamba
                </h1>
            </header>

            {/* Content */}
            <motion.div
                className="flex min-h-0 flex-1 flex-col px-4 pt-4 pb-8"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
            >
                <form className="flex min-h-0 flex-1 flex-col gap-7" onSubmit={handleSubmit} noValidate>
                    {errors._general && (
                        <div className="rounded-lg bg-error_subtle p-3">
                            <p className="text-sm text-error-primary">{errors._general}</p>
                        </div>
                    )}

                    <Input
                        label="¿Qué ofreces?"
                        placeholder="Ej: Reparación de aires"
                        size="lg"
                        value={name}
                        onChange={(value) => {
                            setName(value);
                            if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                        }}
                        isRequired
                        isInvalid={!!errors.name}
                        hint={errors.name || "Dilo como se lo dirías a un vecino"}
                        maxLength={255}
                    />

                    <TextArea
                        label="Cuéntalo con detalle"
                        placeholder="Qué haces, qué llevas contigo, cuánto tardas..."
                        value={description}
                        onChange={(value) => {
                            setDescription(value);
                            if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
                        }}
                        isRequired
                        hideRequiredIndicator
                        isInvalid={!!errors.description}
                        textAreaClassName="h-[116px] resize-none"
                        hint={errors.description}
                        rows={4}
                    />

                    <div className="flex flex-col gap-3">
                        <p className="text-sm font-medium text-secondary">
                            Fotos de tu trabajo <span className="text-error-primary">*</span>
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                            <ImageUploadSlot
                                label="Principal"
                                previewUrl={frontImage.previewUrl}
                                error={frontImage.error}
                                onClick={() => handleImageSlotClick("front")}
                                onRemove={() => handleRemoveImage("front")}
                                hasImage={!!frontImage.blob}
                            />
                            <ImageUploadSlot
                                label="Segunda"
                                previewUrl={secondImage.previewUrl}
                                error={secondImage.error}
                                onClick={() => handleImageSlotClick("second")}
                                onRemove={() => handleRemoveImage("second")}
                                hasImage={!!secondImage.blob}
                            />
                            <ImageUploadSlot
                                label="Tercera"
                                previewUrl={thirdImage.previewUrl}
                                error={thirdImage.error}
                                onClick={() => handleImageSlotClick("third")}
                                onRemove={() => handleRemoveImage("third")}
                                hasImage={!!thirdImage.blob}
                            />
                        </div>
                        <p className="text-sm text-tertiary">Muestra tu oficio con orgullo, las fotos hacen que te contraten más</p>
                    </div>

                    <Input
                        label="Precio"
                        placeholder="15"
                        type="number"
                        size="lg"
                        icon={DollarIcon}
                        value={price}
                        onChange={(value) => {
                            setPrice(value);
                            if (errors.price) setErrors((prev) => ({ ...prev, price: undefined }));
                        }}
                        isRequired
                        isInvalid={!!errors.price}
                        hint={errors.price || "En dólares, por servicio"}
                    />

                    <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={handleFileSelect} />

                    <div className="flex-1" />

                    <Button
                        type="submit"
                        color="primary"
                        size="xl"
                        className={`w-full ${!name.trim() || !description.trim() || !price.trim() ? "opacity-50" : ""}`}
                        isLoading={isSubmitting}
                        showTextWhileLoading
                    >
                        {isSubmitting ? "Publicando" : "Publicar chamba"}
                    </Button>
                </form>
            </motion.div>


            {/* Image Cropper Modal */}
            {showCropper && cropperImageSrc && (
                <ImageCropper
                    imageSrc={cropperImageSrc}
                    outputSize={400}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCropCancel}
                />
            )}
        </div>
    );
}