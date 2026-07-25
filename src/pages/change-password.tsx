import { type FormEvent, useState } from "react";
import { ChevronLeft, Lock01 } from "@untitledui/icons";
import { motion } from "motion/react";
import { useNavigate } from "react-router";

import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { api, ApiError } from "@/utils/api";

export function ChangePassword() {
    const navigate = useNavigate();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<{
        current_password?: string;
        new_password?: string;
        new_password_confirm?: string;
    }>({});

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        // Client-side validation
        const newErrors: typeof errors = {};

        if (!currentPassword.trim()) {
            newErrors.current_password =
                "La contraseña actual es requerida";
        }
        if (newPassword.length < 8) {
            newErrors.new_password =
                "La nueva contraseña debe tener al menos 8 caracteres";
        }
        if (newPassword !== confirmPassword) {
            newErrors.new_password_confirm = "Las contraseñas no coinciden";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // API call
        setIsSubmitting(true);
        try {
            await api<{ detail: string }>("/api/auth/change-password/", {
                method: "POST",
                body: {
                    current_password: currentPassword,
                    new_password: newPassword,
                    new_password_confirm: confirmPassword,
                },
            });
            navigate("/profile");
        } catch (err) {
            if (err instanceof ApiError) {
                const mapped: typeof errors = {};
                if (err.fieldErrors.current_password) {
                    mapped.current_password =
                        err.fieldErrors.current_password[0];
                }
                if (err.fieldErrors.new_password) {
                    mapped.new_password = err.fieldErrors.new_password[0];
                }
                if (err.fieldErrors.new_password_confirm) {
                    mapped.new_password_confirm =
                        err.fieldErrors.new_password_confirm[0];
                }
                setErrors(mapped);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-dvh flex-col bg-white pb-20">
            {/* Header */}
            <header className="flex items-center justify-between px-4 pt-4 pb-2">
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
                {/* Title section */}
                <div className="text-center">
                    <h1 className="text-display-xs font-bold text-primary text-center">
                        Cambiar contraseña
                    </h1>
                    <p className="mt-1 text-sm text-tertiary text-center">
                        Actualiza tu contraseña de acceso
                    </p>
                </div>

                {/* Form */}
                <form
                    className="mt-8 flex flex-1 flex-col gap-5"
                    onSubmit={handleSubmit}
                    noValidate
                >
                    <Input
                        label="Contraseña actual"
                        placeholder="••••••••••"
                        type="password"
                        icon={Lock01}
                        value={currentPassword}
                        onChange={(value) => {
                            setCurrentPassword(value);
                            if (errors.current_password)
                                setErrors((prev) => ({
                                    ...prev,
                                    current_password: undefined,
                                }));
                        }}
                        isRequired
                        isInvalid={!!errors.current_password}
                        hint={errors.current_password}
                    />

                    <Input
                        label="Nueva contraseña"
                        placeholder="••••••••••"
                        type="password"
                        icon={Lock01}
                        value={newPassword}
                        onChange={(value) => {
                            setNewPassword(value);
                            if (errors.new_password)
                                setErrors((prev) => ({
                                    ...prev,
                                    new_password: undefined,
                                }));
                        }}
                        isRequired
                        isInvalid={!!errors.new_password}
                        hint={errors.new_password}
                    />

                    <Input
                        label="Confirmar nueva contraseña"
                        placeholder="••••••••••"
                        type="password"
                        icon={Lock01}
                        value={confirmPassword}
                        onChange={(value) => {
                            setConfirmPassword(value);
                            if (errors.new_password_confirm)
                                setErrors((prev) => ({
                                    ...prev,
                                    new_password_confirm: undefined,
                                }));
                        }}
                        isRequired
                        isInvalid={!!errors.new_password_confirm}
                        hint={errors.new_password_confirm}
                    />

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
                            {isSubmitting
                                ? "Cambiando..."
                                : "Cambiar contraseña"}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
