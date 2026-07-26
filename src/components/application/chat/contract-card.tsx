import { useEffect, useState } from "react";
import { FileCode01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { api } from "@/utils/api";
import { formatMessageTimestamp } from "@/utils/chat";
import type { Contract } from "@/types/chat";

export interface ContractCardProps {
  contractId: string;
  isOwnMessage: boolean;
  isClient: boolean; // current user is client_user of the room
  timestamp: string;
}

// Map contract status to badge color
const getStatusColor = (
  status: Contract["status"],
): "brand" | "success" | "warning" | "error" | "gray" => {
  switch (status) {
    case "Activo":
      return "brand";
    case "Confirmado":
      return "success";
    case "Propuesta":
      return "warning";
    case "Concluido":
      return "gray";
    case "Disputa":
      return "error";
    case "Cancelado":
      return "error";
    default:
      return "gray";
  }
};

export function ContractCard({
  contractId,
  isOwnMessage,
  isClient,
  timestamp,
}: ContractCardProps) {
  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const formattedTime = formatMessageTimestamp(timestamp);

  useEffect(() => {
    // If this is talent's own message, don't fetch contract details
    if (isOwnMessage && !isClient) {
      setIsLoading(false);
      return;
    }

    // Fetch contract details only if client is viewing
    const fetchContract = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await api<Contract>(
          `/api/contracts/retrieve/${contractId}/`,
        );
        setContract(data);
      } catch {
        setError("Detalles del contrato no disponibles");
      } finally {
        setIsLoading(false);
      }
    };

    fetchContract();
  }, [contractId, isClient, isOwnMessage]);

  // Talent sent it: render "Contrato enviado" in brand-red, right-aligned
  if (isOwnMessage && !isClient) {
    return (
      <div className="flex justify-end gap-2">
        <div className="flex flex-col gap-1">
          <div className="flex justify-end">
            <span className="text-sm font-semibold text-brand-red">
              Contrato enviado
            </span>
          </div>
          <div className="flex justify-end">
            <span className="text-xs text-tertiary">{formattedTime}</span>
          </div>
        </div>
      </div>
    );
  }

  // Client viewing: show contract card with details, left-aligned
  return (
    <div className="flex justify-start gap-2">
      <div className="flex w-full max-w-sm flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs">
        {/* Header with icon and title */}
        <div className="flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-brand-50">
            <FileCode01 className="size-5 text-brand-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-primary">Contrato</h3>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="py-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-200" />
            <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-neutral-200" />
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="text-sm text-tertiary">{error}</div>
        )}

        {/* Contract details */}
        {contract && !isLoading && !error && (
          <>
            {/* Service description - title */}
            <div>
              <p className="text-sm font-semibold text-primary">
                {contract.gig}
              </p>
            </div>

            {/* Price and type */}
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-primary">
                ${contract.price.toLocaleString()}
              </span>
              <span className="text-xs text-tertiary">
                {contract.price_type === "Horas" ? "por hora" : "por servicio"}
              </span>
            </div>

            {/* Status badge */}
            <div className="flex gap-2">
              <Badge
                type="pill-color"
                color={getStatusColor(contract.status)}
                size="sm"
              >
                {contract.status}
              </Badge>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                color="secondary"
                size="md"
                className="w-full text-sm"
                disabled
              >
                Ver contrato
              </Button>
            </div>
          </>
        )}

        {/* Timestamp below card */}
        <div className="pt-2">
          <span className="text-xs text-tertiary">{formattedTime}</span>
        </div>
      </div>
    </div>
  );
}

ContractCard.displayName = "ContractCard";
