import { type FormEvent, useState } from "react";
import { AlertTriangle, ChevronLeft, Lock01, Mail01 } from "@untitledui/icons";
import { motion } from "motion/react";
import { useNavigate } from "react-router";

import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { api, ApiError } from "@/utils/api";
import { setToken } from "@/utils/auth";

export function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [generalError, setGeneralError] = useState("");
    const [errors, setErrors] = useState<{
        email?: string;
        password?: string;
    }>({});

    const validateForm = () => {
        const newErrors: typeof errors = {};

        if (!email.trim()) {
            newErrors.email = "El correo o usuario es requerido";
        }

        if (!password.trim()) {
            newErrors.password = "La contraseña es requerida";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setGeneralError("");
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const response = await api<{ token: string }>("/api/auth/login/", {
                method: "POST",
                body: {
                    email: email.trim(),
                    password,
                },
            });

            setToken(response.token);
            navigate("/home");
        } catch (err) {
            if (err instanceof ApiError) {
                const fe = err.fieldErrors;

                if (fe._general) {
                    setGeneralError(fe._general[0]);
                } else if (fe.non_field_errors) {
                    setGeneralError(fe.non_field_errors[0]);
                } else if (fe.detail) {
                    setGeneralError(
                        Array.isArray(fe.detail)
                            ? fe.detail[0]
                            : "Usuario o contraseña incorrectos. Revisa e intenta de nuevo",
                    );
                } else {
                    const newErrors: typeof errors = {};
                    if (fe.email) newErrors.email = fe.email[0];
                    if (fe.password) newErrors.password = fe.password[0];
                    if (Object.keys(newErrors).length > 0) {
                        setErrors(newErrors);
                    } else {
                        setGeneralError(
                            "Usuario o contraseña incorrectos. Revisa e intenta de nuevo",
                        );
                    }
                }
            }
        } finally {
            setIsSubmitting(false);
        }
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
                    <h1 className="text-display-xs font-bold text-primary">
                        ¡Qué bueno verte de nuevo!
                    </h1>
                    <p className="mt-1 text-sm text-tertiary">
                        Tu comunidad te espera
                    </p>
                </div>

                {/* General error banner */}
                {generalError && (
                    <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-500" />
                        <p className="text-sm text-red-600">{generalError}</p>
                    </div>
                )}

                {/* Form */}
                <form
                    className="mt-8 flex flex-1 flex-col gap-5"
                    onSubmit={handleSubmit}
                    noValidate
                >
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
                            if (generalError) setGeneralError("");
                        }}
                        isRequired
                        isInvalid={!!errors.email}
                        hint={
                            errors.email ||
                            "Tambien puedes usar tu nombre de usuario"
                        }
                    />

                    <Input
                        label="Contraseña"
                        placeholder="••••••••••••"
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
                            if (generalError) setGeneralError("");
                        }}
                        isRequired
                        isInvalid={!!errors.password}
                        hint={errors.password}
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
                            {isSubmitting ? "Entrando..." : "Entrar"}
                        </Button>

                        <p className="mt-4 text-center text-sm text-tertiary">
                            ¿Nuevo por aquí?{" "}
                            <button
                                type="button"
                                onClick={() => navigate("/signup")}
                                className="font-semibold text-brand-600"
                            >
                                Crea tu cuenta
                            </button>
                        </p>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
