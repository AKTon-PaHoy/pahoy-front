import { useState } from "react";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { api, ApiError } from "@/utils/api";
import type { Contract, CreateContractPayload, Message } from "@/types/chat";

export interface ContractProposalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (message: Message) => void;
    roomId: string;
    gig: {
        id: string;
        name: string;
        price: number | null;
        price_type: string;
    };
}

export function ContractProposalModal({ isOpen, onClose, onSuccess, roomId, gig }: ContractProposalModalProps) {
    const [price, setPrice] = useState<string>(gig.price !== null ? String(gig.price) : "");
    const [priceType, setPriceType] = useState<"Fijo" | "Horas">((gig.price_type === "Horas" ? "Horas" : "Fijo") as "Fijo" | "Horas");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validatePrice = (value: string): string | null => {
        if (!value || value.trim() === "") {
            return "El precio es requerido";
        }

        const numValue = Number(value);
        if (isNaN(numValue)) {
            return "Ingresa un precio válido";
        }

        if (numValue < 0.01) {
            return "El precio mínimo es $0.01";
        }

        if (numValue > 999999999.99) {
            return "El precio máximo es $999,999,999.99";
        }

        return null;
    };

    const handlePriceChange = (newValue: string) => {
        setPrice(newValue);
        if (errors.price) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next.price;
                return next;
            });
        }
    };

    const handleConfirm = async () => {
        // Client-side validation
        const priceError = validatePrice(price);
        if (priceError) {
            setErrors({ price: priceError });
            return;
        }

        setIsSubmitting(true);
        setErrors({});

        try {
            // Step 1: Create contract
            const payload: CreateContractPayload = {
                gig: gig.id,
                price: Number(price),
                price_type: priceType,
            };

            const contract = await api<Contract>("/api/contracts/create/", {
                method: "POST",
                body: payload,
            });

            // Step 2: Send chat message with contract UUID
            try {
                const message = await api<Message>(`/api/chat/rooms/${roomId}/messages/`, {
                    method: "POST",
                    body: {
                        room: roomId,
                        contract: contract.id,
                        content: "Propuesta de contrato enviada",
                    },
                });

                onSuccess(message);
                onClose();
            } catch {
                // Contract was created but message failed — close anyway
                // Message will appear on next sync cycle
                onClose();
            }
        } catch (err) {
            if (err instanceof ApiError && err.status === 400) {
                // Map field errors from backend
                const fieldErrors: Record<string, string> = {};
                for (const [field, messages] of Object.entries(err.fieldErrors)) {
                    if (Array.isArray(messages) && messages.length > 0) {
                        fieldErrors[field] = messages[0];
                    }
                }
                setErrors(fieldErrors);
            } else {
                setErrors({ _general: "Error al crear el contrato. Intenta de nuevo." });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={(open) => !open && onClose()} isDismissable={!isSubmitting}>
            <Modal className="max-w-md">
                <Dialog>
                    <div className="flex w-full max-w-md flex-col rounded-xl bg-white p-6">
                        {/* Header */}
                        <h2 className="text-lg font-semibold text-primary">Enviar propuesta de contrato</h2>
                        <p className="mt-1 text-sm text-tertiary">Confirma los detalles del contrato antes de enviar.</p>

                        {/* Form */}
                        <div className="mt-5 flex flex-col gap-4">
                            {/* Gig name (read-only) */}
                            <Input
                                label="Servicio"
                                value={gig.name}
                                isDisabled
                                isReadOnly
                                placeholder="Nombre del servicio"
                            />

                            {/* Price */}
                            <Input
                                label="Precio"
                                placeholder="0.00"
                                value={price}
                                onChange={handlePriceChange}
                                isDisabled={isSubmitting}
                                isInvalid={!!errors.price}
                                hint={errors.price}
                                isRequired
                                type="text"
                                inputMode="decimal"
                            />

                            {/* Price type radio group */}
                            <div className="flex flex-col gap-1.5">
                                <span className="text-sm font-medium text-secondary">Tipo de precio</span>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={() => setPriceType("Fijo")}
                                        className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                                            priceType === "Fijo"
                                                ? "bg-brand-solid text-white shadow-xs"
                                                : "bg-primary text-secondary ring-1 ring-primary ring-inset hover:bg-primary_hover"
                                        } disabled:cursor-not-allowed disabled:opacity-50`}
                                    >
                                        Fijo
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={() => setPriceType("Horas")}
                                        className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                                            priceType === "Horas"
                                                ? "bg-brand-solid text-white shadow-xs"
                                                : "bg-primary text-secondary ring-1 ring-primary ring-inset hover:bg-primary_hover"
                                        } disabled:cursor-not-allowed disabled:opacity-50`}
                                    >
                                        Horas
                                    </button>
                                </div>
                                {errors.price_type && <span className="text-sm text-error-primary">{errors.price_type}</span>}
                            </div>

                            {/* General error */}
                            {errors._general && <p className="text-sm text-error-primary">{errors._general}</p>}
                        </div>

                        {/* Actions */}
                        <div className="mt-6 flex flex-col gap-3">
                            <Button
                                type="button"
                                color="primary"
                                size="xl"
                                className="w-full"
                                isLoading={isSubmitting}
                                showTextWhileLoading
                                isDisabled={isSubmitting}
                                onClick={handleConfirm}
                            >
                                {isSubmitting ? "Enviando..." : "Enviar contrato"}
                            </Button>
                            <Button
                                type="button"
                                color="tertiary"
                                size="xl"
                                className="w-full"
                                isDisabled={isSubmitting}
                                onClick={onClose}
                            >
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}

ContractProposalModal.displayName = "ContractProposalModal";
