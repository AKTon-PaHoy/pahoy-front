import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { Camera01, ChevronLeft, User01 } from "@untitledui/icons";
import { motion } from "motion/react";
import { useNavigate } from "react-router";

import { ImageCropper } from "@/components/application/image-cropper/image-cropper";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { LocationSection } from "@/components/application/location/location-section";
import { fromGeoJSON } from "@/utils/coordinates";
import { api, apiMultipart, ApiError } from "@/utils/api";

export function ProfileEdit() {
    const navigate = useNavigate();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [bio, setBio] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [errors, setErrors] = useState<{
        first_name?: string;
        last_name?: string;
        bio?: string;
        phone_number?: string;
    }>({});
    const [isUploadingPic, setIsUploadingPic] = useState(false);
    const [picError, setPicError] = useState<string | null>(null);
    const [userCoordinates, setUserCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [cropperImageSrc, setCropperImageSrc] = useState<string | null>(null);
    const [showCropper, setShowCropper] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [userData, profileData] = await Promise.all([
                    api<{ username: string; email: string; location: string | { type: string; coordinates: [number, number] } | null }>("/api/auth/user/"),
                    api<{
                        first_name: string;
                        last_name: string;
                        bio: string;
                        phone_number: string;
                        profile_pic: string | null;
                    }>("/api/profile/retrieve/"),
                ]);

                setFirstName(profileData.first_name);
                setLastName(profileData.last_name);
                setBio(profileData.bio);
                setPhoneNumber(profileData.phone_number);
                setProfilePicUrl(profileData.profile_pic);
                setUserCoordinates(fromGeoJSON(userData.location));
            } catch {
                setFetchError(
                    "No pudimos cargar tu perfil. Intenta de nuevo más tarde.",
                );
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const objectUrl = URL.createObjectURL(file);
        setCropperImageSrc(objectUrl);
        setShowCropper(true);
        // Reset file input so re-selecting same file triggers change
        e.target.value = "";
    };

    useEffect(() => {
        return () => {
            if (cropperImageSrc) {
                URL.revokeObjectURL(cropperImageSrc);
            }
        };
    }, [cropperImageSrc]);

    const handleCropComplete = async (blob: Blob) => {
        if (cropperImageSrc) {
            URL.revokeObjectURL(cropperImageSrc);
            setCropperImageSrc(null);
        }
        setShowCropper(false);

        setPicError(null);
        setIsUploadingPic(true);
        try {
            const formData = new FormData();
            formData.append("profile_pic", blob, "profile.jpg");
            const result = await apiMultipart<{ profile_pic: string | null }>(
                "/api/profile/update/",
                { method: "PATCH", body: formData },
            );
            setProfilePicUrl(result.profile_pic);
        } catch {
            setPicError("No se pudo subir la imagen");
        } finally {
            setIsUploadingPic(false);
        }
    };

    const handleCropCancel = () => {
        if (cropperImageSrc) {
            URL.revokeObjectURL(cropperImageSrc);
            setCropperImageSrc(null);
        }
        setShowCropper(false);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        // Client-side validation
        const newErrors: typeof errors = {};
        if (!firstName.trim()) {
            newErrors.first_name = "El nombre es requerido";
        }
        if (!lastName.trim()) {
            newErrors.last_name = "El apellido es requerido";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // API call
        setIsSubmitting(true);
        try {
            await api("/api/profile/update/", {
                method: "PATCH",
                body: {
                    first_name: firstName.trim(),
                    last_name: lastName.trim(),
                    bio: bio.trim(),
                    phone_number: phoneNumber.trim(),
                },
            });
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (err) {
            if (err instanceof ApiError) {
                const mapped: typeof errors = {};
                const fe = err.fieldErrors;
                if (fe.first_name) mapped.first_name = fe.first_name[0];
                if (fe.last_name) mapped.last_name = fe.last_name[0];
                if (fe.bio) mapped.bio = fe.bio[0];
                if (fe.phone_number) mapped.phone_number = fe.phone_number[0];
                setErrors(mapped);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex min-h-dvh flex-col items-center justify-center bg-white"
            >
                <p className="text-sm text-tertiary">Cargando...</p>
            </motion.div>
        );
    }

    if (fetchError) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex min-h-dvh flex-col items-center justify-center bg-white px-4"
            >
                <p className="text-center text-sm text-error-primary">
                    {fetchError}
                </p>
            </motion.div>
        );
    }

    return (
        <div className="flex min-h-dvh flex-col bg-white pb-20">
            {/* Header */}
            <header className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 pt-4 pb-2">
                <button
                    onClick={() => navigate("/profile")}
                    className="flex size-10 items-center justify-center rounded-lg text-neutral-500"
                    aria-label="Volver"
                >
                    <ChevronLeft className="size-6" />
                </button>
                <img src="/thunderface.png" alt="Pa·Hoy" className="h-8" />
                <div className="size-10" />
            </header>

            {/* Content */}
            <motion.div
                className="flex flex-1 flex-col px-4 pt-6"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
            >
                {/* Profile Picture - tappable for upload */}
                <div className="flex flex-col items-center">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="relative size-24"
                        aria-label="Cambiar foto de perfil"
                    >
                        {profilePicUrl ? (
                            <img
                                src={profilePicUrl}
                                alt="Foto de perfil"
                                className="size-24 rounded-full object-cover"
                            />
                        ) : (
                            <div className="flex size-24 items-center justify-center rounded-full bg-neutral-100">
                                <User01 className="size-10 text-neutral-400" />
                            </div>
                        )}
                        {/* Camera overlay icon */}
                        <div className="absolute bottom-0 right-0 flex size-7 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm">
                            <Camera01 className="size-4" />
                        </div>
                        {/* Loading overlay */}
                        {isUploadingPic && (
                            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                                <p className="text-xs text-white">Subiendo...</p>
                            </div>
                        )}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                    {picError && (
                        <p className="mt-2 text-center text-sm text-error-primary">
                            {picError}
                        </p>
                    )}
                </div>

                {/* Editable form fields */}
                <form
                    className="mt-8 flex flex-1 flex-col gap-5"
                    onSubmit={handleSubmit}
                    noValidate
                >
                    <Input
                        label="Nombre"
                        placeholder="Tu nombre"
                        value={firstName}
                        onChange={(v) => {
                            setFirstName(v);
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
                        placeholder="Tu apellido"
                        value={lastName}
                        onChange={(v) => {
                            setLastName(v);
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
                        label="Teléfono"
                        placeholder="Tu número de teléfono"
                        value={phoneNumber}
                        onChange={(v) => {
                            setPhoneNumber(v);
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
                        label="Bio"
                        placeholder="Cuéntanos sobre ti"
                        value={bio}
                        onChange={(v) => {
                            setBio(v);
                            if (errors.bio)
                                setErrors((prev) => ({
                                    ...prev,
                                    bio: undefined,
                                }));
                        }}
                        isInvalid={!!errors.bio}
                        hint={errors.bio}
                    />

                    {/* Location Section */}
                    <LocationSection
                        coordinates={userCoordinates}
                        onLocationUpdated={setUserCoordinates}
                    />

                    {showSuccess && (
                        <p className="text-center text-sm text-success-primary">
                            Perfil actualizado correctamente
                        </p>
                    )}

                    {/* Spacer to push button to bottom */}
                    <div className="flex-1" />

                    {/* Submit button */}
                    <div className="pb-8">
                        <Button
                            type="submit"
                            color="primary"
                            size="xl"
                            className="w-full"
                            isLoading={isSubmitting}
                            showTextWhileLoading
                        >
                            {isSubmitting ? "Guardando..." : "Guardar cambios"}
                        </Button>
                    </div>
                </form>
            </motion.div>

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
