import { type FormEvent, useEffect, useRef, useState } from "react";
import { CameraPlus, CheckCircle, Loading02, MarkerPin01, User01 } from "@untitledui/icons";
import { motion } from "motion/react";
import { useNavigate } from "react-router";

import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { InputBase } from "@/components/base/input/input";
import { HintText } from "@/components/base/input/hint-text";
import { Label } from "@/components/base/input/label";
import { ImageCropper } from "@/components/application/image-cropper/image-cropper";
import { api, apiMultipart, ApiError } from "@/utils/api";

interface Profile {
    onboarding_complete: boolean;
}

interface ProfileFormErrors {
    first_name?: string;
    last_name?: string;
    birth_date?: string;
    document_id?: string;
    phone_number?: string;
    bio?: string;
    profile_pic?: string;
}

export function CompleteProfile() {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Profile picture state
    const [profilePicBlob, setProfilePicBlob] = useState<Blob | null>(null);
    const [profilePicPreview, setProfilePicPreview] = useState<string | null>(
        null,
    );
    const [cropperImageSrc, setCropperImageSrc] = useState<string | null>(null);
    const [showCropper, setShowCropper] = useState(false);

    // Form field state
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [documentType, setDocumentType] = useState<
        "CV" | "CE" | "PASS" | "OTHER"
    >("CV");
    const [documentNumber, setDocumentNumber] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [bio, setBio] = useState("");

    // Form errors state
    const [errors, setErrors] = useState<ProfileFormErrors>({});

    // Location detection state
    const [isDetectingLocation, setIsDetectingLocation] = useState(false);
    const [locationDetected, setLocationDetected] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);

    // Submission state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        api<Profile>("/api/profile/retrieve/").then(
            (profile) => {
                if (profile.onboarding_complete) {
                    navigate("/home", { replace: true });
                }
            },
        );
    }, [navigate]);

    // Clean up object URLs on unmount
    useEffect(() => {
        return () => {
            if (profilePicPreview) {
                URL.revokeObjectURL(profilePicPreview);
            }
            if (cropperImageSrc) {
                URL.revokeObjectURL(cropperImageSrc);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const objectUrl = URL.createObjectURL(file);
        setCropperImageSrc(objectUrl);
        setShowCropper(true);

        // Reset file input so re-selecting the same file triggers change
        e.target.value = "";
    };

    const handleCropComplete = (blob: Blob) => {
        // Revoke old preview if exists
        if (profilePicPreview) {
            URL.revokeObjectURL(profilePicPreview);
        }

        const previewUrl = URL.createObjectURL(blob);
        setProfilePicBlob(blob);
        setProfilePicPreview(previewUrl);

        // Revoke cropper source and close
        if (cropperImageSrc) {
            URL.revokeObjectURL(cropperImageSrc);
            setCropperImageSrc(null);
        }
        setShowCropper(false);
    };

    const handleCropCancel = () => {
        // Revoke cropper source and close
        if (cropperImageSrc) {
            URL.revokeObjectURL(cropperImageSrc);
            setCropperImageSrc(null);
        }
        setShowCropper(false);
    };

    const handleDetectLocation = async () => {
        setIsDetectingLocation(true);
        setLocationError(null);

        try {
            const position = await new Promise<GeolocationPosition>(
                (resolve, reject) =>
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 10000,
                    }),
            );

            await api("/api/auth/update-location/", {
                method: "PATCH",
                body: {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                },
            });

            setLocationDetected(true);
        } catch (err) {
            if (err instanceof GeolocationPositionError || (err && typeof err === "object" && "code" in err)) {
                const geoErr = err as GeolocationPositionError;
                if (geoErr.code === 1) {
                    setLocationError("Permiso de ubicación denegado. Puedes continuar sin ella.");
                } else if (geoErr.code === 2) {
                    setLocationError("No pudimos detectar tu ubicación. Puedes continuar sin ella.");
                } else {
                    setLocationError("Tiempo agotado al detectar ubicación. Puedes continuar sin ella.");
                }
            } else {
                setLocationError("No pudimos detectar tu ubicación. Puedes continuar sin ella.");
            }
        } finally {
            setIsDetectingLocation(false);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: ProfileFormErrors = {};
        if (!firstName.trim()) newErrors.first_name = "El nombre es requerido";
        if (!lastName.trim()) newErrors.last_name = "El apellido es requerido";
        if (!birthDate) newErrors.birth_date = "La fecha de nacimiento es requerida";
        if (!documentNumber.trim()) newErrors.document_id = "El documento es requerido";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append("first_name", firstName.trim());
            formData.append("last_name", lastName.trim());
            formData.append("birth_date", birthDate);
            formData.append("document_id", `${documentType}-${documentNumber.trim()}`);
            if (phoneNumber.trim()) formData.append("phone_number", phoneNumber.trim());
            if (bio.trim()) formData.append("bio", bio.trim());
            if (profilePicBlob) formData.append("profile_pic", profilePicBlob, "profile.jpg");
            formData.append("onboarding_complete", "true");

            await apiMultipart<Profile>("/api/profile/update/", {
                method: "PATCH",
                body: formData,
            });

            setShowSuccess(true);
            setTimeout(() => navigate("/home", { replace: true }), 2000);
        } catch (err) {
            if (err instanceof ApiError) {
                const fe = err.fieldErrors;
                const newErrors: ProfileFormErrors = {};
                if (fe.first_name) newErrors.first_name = fe.first_name[0];
                if (fe.last_name) newErrors.last_name = fe.last_name[0];
                if (fe.birth_date) newErrors.birth_date = fe.birth_date[0];
                if (fe.document_id) newErrors.document_id = fe.document_id[0];
                if (fe.phone_number) newErrors.phone_number = fe.phone_number[0];
                if (fe.bio) newErrors.bio = fe.bio[0];
                if (fe.profile_pic) newErrors.profile_pic = fe.profile_pic[0];
                setErrors(newErrors);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-dvh flex-col bg-white">
            {/* Header */}
            <header className="flex items-center justify-between px-4 pt-4 pb-2">
                {/* Left spacer (no back button — onboarding cannot be skipped) */}
                <div className="size-10" />
                <img src="/thunderface.png" alt="Pa·Hoy" className="h-8" />
                {/* Right spacer to balance the layout */}
                <div className="size-10" />
            </header>

            {/* Content */}
            <motion.div
                className="flex flex-1 flex-col px-4 pt-6"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
            >
                {/* Title section */}
                <div className="text-center">
                    <h1 className="text-display-xs font-bold text-primary">
                        Completa tu perfil
                    </h1>
                    <p className="mt-1 text-sm text-tertiary">
                        Cuéntanos un poco sobre ti
                    </p>
                </div>

                {/* Form */}
                <form className="mt-8 flex flex-1 flex-col gap-5" onSubmit={handleSubmit} noValidate>
                    {/* Profile picture upload */}
                    <div className="flex flex-col items-center">
                        <button
                            type="button"
                            onClick={handleAvatarClick}
                            className="relative flex size-28 items-center justify-center rounded-full bg-neutral-100 ring-2 ring-neutral-200 transition-shadow hover:ring-brand-300 focus:outline-none focus:ring-brand-500"
                            aria-label="Subir foto de perfil"
                        >
                            <div className="flex size-full items-center justify-center overflow-hidden rounded-full">
                                {profilePicPreview ? (
                                    <img
                                        src={profilePicPreview}
                                        alt="Foto de perfil"
                                        className="size-full object-cover"
                                    />
                                ) : (
                                    <User01 className="size-12 text-neutral-400" />
                                )}
                            </div>

                            {/* Camera overlay badge */}
                            <span className="absolute right-0 bottom-0 flex size-8 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm">
                                <CameraPlus className="size-4" />
                            </span>
                        </button>

                        <p className="mt-2 text-xs text-tertiary">
                            Toca para agregar foto
                        </p>

                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleFileSelect}
                            className="hidden"
                            aria-hidden="true"
                        />
                    </div>

                    {/* Form fields */}
                    <Input
                        label="Nombre"
                        placeholder="Ej: Ramón"
                        value={firstName}
                        onChange={(value) => {
                            setFirstName(value);
                            if (errors.first_name)
                                setErrors((prev) => ({
                                    ...prev,
                                    first_name: undefined,
                                }));
                        }}
                        isRequired
                        isInvalid={!!errors.first_name}
                        hint={errors.first_name}
                    />

                    <Input
                        label="Apellido"
                        placeholder="Ej: Pérez"
                        value={lastName}
                        onChange={(value) => {
                            setLastName(value);
                            if (errors.last_name)
                                setErrors((prev) => ({
                                    ...prev,
                                    last_name: undefined,
                                }));
                        }}
                        isRequired
                        isInvalid={!!errors.last_name}
                        hint={errors.last_name}
                    />

                    <Input
                        label="Fecha de nacimiento"
                        type="date"
                        value={birthDate}
                        onChange={(value) => {
                            setBirthDate(value);
                            if (errors.birth_date)
                                setErrors((prev) => ({
                                    ...prev,
                                    birth_date: undefined,
                                }));
                        }}
                        isRequired
                        isInvalid={!!errors.birth_date}
                        hint={errors.birth_date}
                    />

                    {/* Document ID composite input */}
                    <div className="flex flex-col gap-1.5">
                        <Label isRequired>Documento de identidad</Label>
                        <div className="flex gap-2">
                            <select
                                value={documentType}
                                onChange={(e) => {
                                    setDocumentType(
                                        e.target.value as
                                            | "CV"
                                            | "CE"
                                            | "PASS"
                                            | "OTHER",
                                    );
                                    if (errors.document_id)
                                        setErrors((prev) => ({
                                            ...prev,
                                            document_id: undefined,
                                        }));
                                }}
                                className="rounded-lg bg-primary px-3 py-2 text-sm ring-1 ring-primary ring-inset"
                            >
                                <option value="CV">CV</option>
                                <option value="CE">CE</option>
                                <option value="PASS">PASS</option>
                                <option value="OTHER">OTHER</option>
                            </select>
                            <InputBase
                                placeholder="1234567890"
                                value={documentNumber}
                                onChange={(e) => {
                                    setDocumentNumber(e.target.value);
                                    if (errors.document_id)
                                        setErrors((prev) => ({
                                            ...prev,
                                            document_id: undefined,
                                        }));
                                }}
                                inputMode="numeric"
                                isInvalid={!!errors.document_id}
                            />
                        </div>
                        {errors.document_id && (
                            <HintText isInvalid>
                                {errors.document_id}
                            </HintText>
                        )}
                    </div>

                    <Input
                        label="Teléfono"
                        placeholder="+58..."
                        type="tel"
                        value={phoneNumber}
                        onChange={(value) => {
                            setPhoneNumber(value);
                            if (errors.phone_number)
                                setErrors((prev) => ({
                                    ...prev,
                                    phone_number: undefined,
                                }));
                        }}
                        isInvalid={!!errors.phone_number}
                        hint={errors.phone_number}
                    />

                    <Input
                        label="Sobre ti"
                        placeholder="Cuéntanos sobre ti..."
                        value={bio}
                        onChange={(value) => {
                            setBio(value);
                            if (errors.bio)
                                setErrors((prev) => ({
                                    ...prev,
                                    bio: undefined,
                                }));
                        }}
                        isInvalid={!!errors.bio}
                        hint={errors.bio}
                    />

                    {/* Location detection */}
                    <div className="flex flex-col gap-2">
                        <button
                            type="button"
                            onClick={handleDetectLocation}
                            disabled={isDetectingLocation}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-medium text-secondary transition hover:bg-tertiary"
                        >
                            {isDetectingLocation ? (
                                <Loading02 className="size-4 animate-spin" />
                            ) : locationDetected ? (
                                <CheckCircle className="size-4 text-success-primary" />
                            ) : (
                                <MarkerPin01 className="size-4" />
                            )}
                            {locationDetected
                                ? "Ubicación detectada"
                                : "Detectar ubicación"}
                        </button>
                        {locationError && (
                            <p className="text-center text-xs text-tertiary">
                                {locationError}
                            </p>
                        )}
                    </div>

                    {/* Spacer to push button to bottom */}
                    <div className="flex-1" />

                    {/* Submit area */}
                    <div className="pb-8">
                        <Button
                            type="submit"
                            color="primary"
                            size="xl"
                            className="w-full"
                            isLoading={isSubmitting}
                            showTextWhileLoading
                        >
                            {isSubmitting
                                ? "Guardando tu perfil..."
                                : "Completar perfil"}
                        </Button>
                    </div>
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

            {/* Success Screen */}
            {showSuccess && (
                <motion.div
                    className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.1 }}
                    >
                        <CheckCircle className="size-16 text-success-primary" />
                    </motion.div>
                    <h2 className="mt-4 text-display-xs font-bold text-primary">
                        ¡Perfil completado!
                    </h2>
                    <p className="mt-2 text-sm text-tertiary">
                        Te estamos llevando a tu comunidad...
                    </p>
                </motion.div>
            )}
        </div>
    );
}
