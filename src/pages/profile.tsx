import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
    AlertTriangle,
    Briefcase02,
    ChevronRight,
    Edit05,
    Lock01,
    LogOut01,
    Mail01,
    MarkerPin01,
    Trash01,
    User01,
} from "@untitledui/icons";
import { motion } from "motion/react";

import { Button } from "@/components/base/buttons/button";
import {
    Dialog,
    DialogTrigger,
    Modal,
    ModalOverlay,
} from "@/components/application/modals/modal";
import { useReverseGeocode } from "@/hooks/use-reverse-geocode";
import { api } from "@/utils/api";
import { clearToken } from "@/utils/auth";
import { fromGeoJSON } from "@/utils/coordinates";

export function Profile() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
    const [userCoordinates, setUserCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Gigs state (independent loading)
    const [gigCount, setGigCount] = useState<number>(0);
    const [gigsLoading, setGigsLoading] = useState(true);
    const [gigsError, setGigsError] = useState<string | null>(null);

    // Dialog states
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [userData, profileData] = await Promise.all([
                    api<{ username: string; email: string; location: string | null }>("/api/auth/user/"),
                    api<{
                        first_name: string;
                        last_name: string;
                        bio: string;
                        phone_number: string;
                        profile_pic: string | null;
                    }>("/api/profile/retrieve/"),
                ]);

                setUsername(userData.username);
                setFirstName(profileData.first_name);
                setLastName(profileData.last_name);
                setProfilePicUrl(profileData.profile_pic);
                setUserCoordinates(fromGeoJSON(userData.location));
            } catch {
                setFetchError(
                    "No pudimos cargar tu perfil. Intenta de nuevo mas tarde.",
                );
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Fetch gigs separately (independent loading state)
    const fetchGigs = async () => {
        setGigsLoading(true);
        setGigsError(null);
        try {
            const data = await api<{ count: number }>("/api/gigs/my-gigs/");
            setGigCount(data.count);
        } catch {
            setGigsError("No pudimos cargar tus chambas");
        } finally {
            setGigsLoading(false);
        }
    };

    useEffect(() => {
        fetchGigs();
    }, []);

    const handleLogout = async () => {
        try {
            await api("/api/auth/logout/", { method: "POST" });
        } catch {
            // Logout is best-effort — clear token regardless
        } finally {
            clearToken();
            navigate("/");
        }
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        setDeleteError(null);
        try {
            await api("/api/auth/delete-account/", { method: "DELETE" });
            clearToken();
            navigate("/");
        } catch {
            setDeleteError(
                "No pudimos eliminar tu cuenta. Intenta de nuevo mas tarde.",
            );
        } finally {
            setIsDeleting(false);
        }
    };

    const { address: fullAddress } = useReverseGeocode(userCoordinates);

    // Show a compact location: skip the street, pick 2 distinct segments
    const shortAddress = (() => {
        if (!fullAddress) return null;
        const parts = fullAddress.split(",").map((s) => s.trim());
        const candidates = parts.slice(1).filter((part, i, arr) => {
            return !arr.slice(0, i).some((prev) => prev.includes(part) || part.includes(prev));
        });
        return candidates.slice(0, 2).join(", ") || parts.slice(0, 2).join(", ");
    })();

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
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex min-h-dvh flex-col bg-white pb-24"
        >
            {/* Banner / Cover Photo */}
            <div className="relative mx-4 mt-4">
                <div className="h-36 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-brand-200 via-brand-400 to-brand-600">
                    <img
                        src="/banner-profile.png"
                        alt=""
                        className="h-full w-full object-cover"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                        }}
                    />
                </div>

                {/* Avatar overlapping the banner */}
                <div className="absolute -bottom-10 left-4">
                    <div className="relative">
                        {profilePicUrl ? (
                            <img
                                src={profilePicUrl}
                                alt="Foto de perfil"
                                className="size-20 rounded-full border-4 border-white object-cover shadow-sm"
                            />
                        ) : (
                            <div className="flex size-20 items-center justify-center rounded-full border-4 border-white bg-neutral-100 shadow-sm">
                                <User01 className="size-8 text-neutral-400" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Profile Button - right aligned below banner */}
            <div className="mt-3 flex justify-end px-4">
                <button
                    onClick={() => navigate("/profile/edit")}
                    className="flex items-center gap-1.5 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-primary"
                >
                    <Edit05 className="size-4" />
                    Editar perfil
                </button>
            </div>

            {/* Name, username, location */}
            <div className="mt-2 px-4">
                <h1 className="text-lg font-bold text-primary">
                    {firstName} {lastName}{" "}
                    <span className="text-sm font-normal text-tertiary">
                        @{username}
                    </span>
                </h1>
                {shortAddress && (
                    <p className="mt-0.5 flex items-center gap-1 text-sm text-tertiary">
                        <MarkerPin01 className="size-3.5 text-brand-500" />
                        {shortAddress}
                    </p>
                )}
            </div>

            {/* Mi trabajo section */}
            <section className="mt-6 px-4">
                <h2 className="text-base font-semibold text-primary">
                    Mi trabajo
                </h2>
                <button
                    onClick={() => navigate("/gigs")}
                    className="mt-3 flex w-full items-center gap-3 rounded-xl border border-neutral-200 px-4 py-3"
                >
                    <div className="flex size-10 items-center justify-center rounded-lg bg-brand-50">
                        <Briefcase02 className="size-5 text-brand-600" />
                    </div>
                    <div className="flex-1 text-left">
                        <p className="text-sm font-semibold text-primary">
                            Mis chambas
                        </p>
                        <p className="text-xs text-tertiary">
                            {gigsLoading
                                ? "Cargando..."
                                : gigsError
                                  ? "Error al cargar"
                                  : `${gigCount} publicadas`}
                        </p>
                    </div>
                    <ChevronRight className="size-5 text-neutral-400" />
                </button>
            </section>

            {/* Cuenta section */}
            <section className="mt-6 px-4">
                <h2 className="text-base font-semibold text-primary">
                    Cuenta
                </h2>
                <div className="mt-3 flex flex-col">
                    {/* Cambiar correo */}
                    <button
                        onClick={() => navigate("/profile/change-email")}
                        className="flex items-center gap-3 py-3"
                    >
                        <Mail01 className="size-5 text-neutral-500" />
                        <span className="flex-1 text-left text-sm text-primary">
                            Cambiar correo
                        </span>
                        <ChevronRight className="size-5 text-neutral-400" />
                    </button>

                    {/* Cambiar contraseña */}
                    <button
                        onClick={() => navigate("/profile/change-password")}
                        className="flex items-center gap-3 py-3"
                    >
                        <Lock01 className="size-5 text-neutral-500" />
                        <span className="flex-1 text-left text-sm text-primary">
                            Cambiar contraseña
                        </span>
                        <ChevronRight className="size-5 text-neutral-400" />
                    </button>

                    {/* Cerrar sesión */}
                    <button
                        onClick={() => setShowLogoutDialog(true)}
                        className="flex items-center gap-3 py-3"
                    >
                        <LogOut01 className="size-5 text-neutral-500" />
                        <span className="flex-1 text-left text-sm text-primary">
                            Cerrar sesión
                        </span>
                    </button>

                    {/* Eliminar cuenta */}
                    <button
                        onClick={() => setShowDeleteDialog(true)}
                        className="flex items-center gap-3 py-3"
                    >
                        <Trash01 className="size-5 text-error-500" />
                        <span className="flex-1 text-left text-sm text-error-primary">
                            Eliminar mi cuenta
                        </span>
                    </button>
                </div>
            </section>

            {/* Version footer */}
            <p className="mt-8 text-center text-xs text-tertiary">
                Pa' Hoy · v1.0
            </p>

            {/* Logout Confirmation Dialog */}
            <DialogTrigger
                isOpen={showLogoutDialog}
                onOpenChange={setShowLogoutDialog}
            >
                <ModalOverlay>
                    <Modal>
                        <Dialog>
                            <div className="flex w-full max-w-sm flex-col items-center rounded-xl bg-white p-6 text-center">
                                <div className="flex size-12 items-center justify-center rounded-full bg-error-50">
                                    <AlertTriangle className="size-6 text-error-600" />
                                </div>
                                <h3 className="mt-4 text-lg font-semibold text-primary">
                                    ¿Cerrar sesión?
                                </h3>
                                <p className="mt-1 text-sm text-tertiary">
                                    Tendrás que iniciar sesión de nuevo para
                                    acceder a tu cuenta.
                                </p>
                                <div className="mt-6 flex w-full flex-col gap-3">
                                    <Button
                                        color="primary-destructive"
                                        size="lg"
                                        className="w-full"
                                        onClick={handleLogout}
                                    >
                                        Sí, cerrar sesión
                                    </Button>
                                    <Button
                                        color="secondary"
                                        size="lg"
                                        className="w-full"
                                        onClick={() =>
                                            setShowLogoutDialog(false)
                                        }
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            </div>
                        </Dialog>
                    </Modal>
                </ModalOverlay>
            </DialogTrigger>

            {/* Delete Account Confirmation Dialog */}
            <DialogTrigger
                isOpen={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
            >
                <ModalOverlay>
                    <Modal>
                        <Dialog>
                            <div className="flex w-full max-w-sm flex-col items-center rounded-xl bg-white p-6 text-center">
                                <div className="flex size-12 items-center justify-center rounded-full bg-error-50">
                                    <AlertTriangle className="size-6 text-error-600" />
                                </div>
                                <h3 className="mt-4 text-lg font-semibold text-primary">
                                    ¿Eliminar cuenta?
                                </h3>
                                <p className="mt-1 text-sm text-tertiary">
                                    Esta acción es permanente y no se puede
                                    deshacer. Se eliminarán todos tus datos.
                                </p>
                                {deleteError && (
                                    <p className="mt-2 text-sm text-error-primary">
                                        {deleteError}
                                    </p>
                                )}
                                <div className="mt-6 flex w-full flex-col gap-3">
                                    <Button
                                        color="primary-destructive"
                                        size="lg"
                                        className="w-full"
                                        onClick={handleDeleteAccount}
                                        isLoading={isDeleting}
                                        showTextWhileLoading
                                    >
                                        {isDeleting
                                            ? "Eliminando..."
                                            : "Sí, eliminar cuenta"}
                                    </Button>
                                    <Button
                                        color="secondary"
                                        size="lg"
                                        className="w-full"
                                        onClick={() =>
                                            setShowDeleteDialog(false)
                                        }
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            </div>
                        </Dialog>
                    </Modal>
                </ModalOverlay>
            </DialogTrigger>
        </motion.div>
    );
}
