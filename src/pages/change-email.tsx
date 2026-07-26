import { type FormEvent, useEffect, useState } from "react";
import { ChevronLeft, Lock01, Mail01 } from "@untitledui/icons";
import { motion } from "motion/react";
import { useNavigate } from "react-router";

import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { api, ApiError } from "@/utils/api";

export function ChangeEmail() {
    const navigate = useNavigate();
    const [currentEmail, setCurrentEmail] = useState("");
    const [password, setPassword] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newEmailConfirm, setNewEmailConfirm] = useState("");

    useEffect(() => {
        api<{ email: string }>("/api/auth/user/").then((data) => {
            setCurrentEmail(data.email);
        }).catch(() => {
            // Non-critical — subtitle will just omit the email
        });
    }, []);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<{
        password?: string;
        new_email?: string;
        new_email_confirm?: string;
    }>({});

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        // Client-side validation
        const newErrors: typeof errors = {};

        if (!password.trim()) {
            newErrors.password = "La contraseña es requerida";
        }
        if (!newEmail.trim()) {
            newErrors.new_email = "El nuevo correo es requerido";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
            newErrors.new_email = "Ingresa un correo electrónico válido";
        }
        if (!newEmailConfirm.trim()) {
            newErrors.new_email_confirm =
                "La confirmación de correo es requerida";
        } else if (newEmail.trim() !== newEmailConfirm.trim()) {
            newErrors.new_email_confirm = "Los correos no coinciden";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // API call
        setIsSubmitting(true);
        try {
            await api("/api/auth/change-email/", {
                method: "POST",
                body: {
                    password: password,
                    new_email: newEmail.trim(),
                    new_email_confirm: newEmailConfirm.trim(),
                },
            });
            navigate("/profile");
        } catch (err) {
            if (err instanceof ApiError) {
                const mapped: typeof errors = {};
                if (err.fieldErrors.password) {
                    mapped.password = err.fieldErrors.password[0];
                }
                if (err.fieldErrors.new_email) {
                    mapped.new_email = err.fieldErrors.new_email[0];
                }
                if (err.fieldErrors.new_email_confirm) {
                    mapped.new_email_confirm =
                        err.fieldErrors.new_email_confirm[0];
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
                        Cambiar correo
                    </h1>
                    <p className="mt-1 text-sm text-tertiary text-center">
                        {currentEmail
                            ? `Tu correo actual es ${currentEmail}`
                            : "Actualiza tu correo electrónico"}
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
                        value={password}
                        onChange={(value) => {
                            setPassword(value);
                            if (errors.password)
                                setErrors((prev) => ({
                                    ...prev,
                                    password: undefined,
                                }));
                        }}
                        isRequired
                        isInvalid={!!errors.password}
                        hint={errors.password}
                    />

                    <Input
                        label="Nuevo correo electrónico"
                        placeholder="tu@correo.com"
                        type="email"
                        icon={Mail01}
                        value={newEmail}
                        onChange={(value) => {
                            setNewEmail(value);
                            if (errors.new_email)
                                setErrors((prev) => ({
                                    ...prev,
                                    new_email: undefined,
                                }));
                        }}
                        isRequired
                        isInvalid={!!errors.new_email}
                        hint={errors.new_email}
                    />

                    <Input
                        label="Confirmar nuevo correo"
                        placeholder="tu@correo.com"
                        type="email"
                        icon={Mail01}
                        value={newEmailConfirm}
                        onChange={(value) => {
                            setNewEmailConfirm(value);
                            if (errors.new_email_confirm)
                                setErrors((prev) => ({
                                    ...prev,
                                    new_email_confirm: undefined,
                                }));
                        }}
                        isRequired
                        isInvalid={!!errors.new_email_confirm}
                        hint={errors.new_email_confirm}
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
                                ? "Actualizando..."
                                : "Cambiar correo"}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
