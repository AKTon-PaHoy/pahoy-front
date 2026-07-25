import { type FormEvent, useState } from "react";
import { CheckCircle, ChevronLeft, Lock01, Mail01 } from "@untitledui/icons";
import { motion } from "motion/react";
import { useNavigate } from "react-router";

import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { api, ApiError } from "@/utils/api";

export function Signup() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<{
        username?: string;
        email?: string;
        password?: string;
        confirmPassword?: string;
    }>({});

    const validateForm = () => {
        const newErrors: typeof errors = {};

        if (!username.trim()) {
            newErrors.username = "El usuario es requerido";
        }

        if (!email.trim()) {
            newErrors.email = "El correo es requerido";
        }

        if (password.length < 8) {
            newErrors.password = "Tu contraseña necesita al menos 8 caracteres";
        }

        if (password !== confirmPassword) {
            newErrors.confirmPassword = "Las contraseñas no coinciden";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            await api("/api/auth/register/", {
                method: "POST",
                body: {
                    username: username.trim(),
                    email: email.trim(),
                    password,
                    password_confirm: confirmPassword,
                },
            });

            // Registration successful — navigate to home or login
            navigate("/home");
        } catch (err) {
            if (err instanceof ApiError) {
                const newErrors: typeof errors = {};
                const fe = err.fieldErrors;

                if (fe.username) {
                    newErrors.username = fe.username[0];
                }
                if (fe.email) {
                    newErrors.email = fe.email[0];
                }
                if (fe.password) {
                    newErrors.password = fe.password[0];
                }
                if (fe.password_confirm) {
                    newErrors.confirmPassword = fe.password_confirm[0];
                }
                if (fe.non_field_errors) {
                    // Show generic errors on password confirm field
                    newErrors.confirmPassword = fe.non_field_errors[0];
                }
                if (fe._general) {
                    newErrors.confirmPassword = fe._general[0];
                }

                setErrors(newErrors);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const passwordHint = () => {
        if (errors.password) {
            return errors.password;
        }
        if (password.length >= 8) {
            return (
                <span className="flex items-center gap-1 text-success-primary">
                    <CheckCircle className="size-3.5" />
                    Debe tener al menos 8 caracteres
                </span>
            );
        }
        return "Debe tener al menos 8 caracteres";
    };

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
                <img src="/splash-logo.png" alt="Pa·Hoy" className="h-8" />
                {/* Spacer to balance the layout */}
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
                        Únete a tu comunidad
                    </h1>
                    <p className="mt-1 text-sm text-tertiary">
                        En un minuto estás dentro
                    </p>
                </div>

                {/* Form */}
                <form
                    className="mt-8 flex flex-1 flex-col gap-5"
                    onSubmit={handleSubmit}
                    noValidate
                >
                    <Input
                        label="Usuario"
                        placeholder="Ej: ramonperez"
                        value={username}
                        onChange={(value) => {
                            setUsername(value);
                            if (errors.username)
                                setErrors((prev) => ({
                                    ...prev,
                                    username: undefined,
                                }));
                        }}
                        isRequired
                        isInvalid={!!errors.username}
                        hint={
                            errors.username ||
                            "Con este nombre entras a Pa' Hoy"
                        }
                    />

                    <Input
                        label="Correo"
                        placeholder="tucorreo@ejemplo.com"
                        type="email"
                        icon={Mail01}
                        value={email}
                        onChange={(value) => {
                            setEmail(value);
                            if (errors.email)
                                setErrors((prev) => ({
                                    ...prev,
                                    email: undefined,
                                }));
                        }}
                        isRequired
                        isInvalid={!!errors.email}
                        hint={errors.email}
                    />

                    <Input
                        label="Contraseña"
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
                        hint={passwordHint()}
                    />

                    <Input
                        label="Repite la contraseña"
                        placeholder="••••••••••"
                        type="password"
                        icon={Lock01}
                        value={confirmPassword}
                        onChange={(value) => {
                            setConfirmPassword(value);
                            if (errors.confirmPassword)
                                setErrors((prev) => ({
                                    ...prev,
                                    confirmPassword: undefined,
                                }));
                        }}
                        isRequired
                        isInvalid={!!errors.confirmPassword}
                        hint={errors.confirmPassword}
                    />

                    {/* Spacer to push button to bottom */}
                    <div className="flex-1" />

                    {/* Submit button and footer */}
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
                                ? "Creando tu cuenta..."
                                : "Crear mi cuenta"}
                        </Button>

                        <p className="mt-4 text-center text-sm text-tertiary">
                            ¿Ya tienes cuenta?{" "}
                            <button
                                type="button"
                                onClick={() => navigate("/")}
                                className="font-semibold text-brand-600"
                            >
                                Entra aquí
                            </button>
                        </p>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
