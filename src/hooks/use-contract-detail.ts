import { useCallback, useEffect, useRef, useState } from "react";

import { Contract, GigDetail } from "@/types/chat";
import { api, ApiError } from "@/utils/api";

export interface UseContractDetailReturn {
  contract: Contract | null;
  gig: GigDetail | null;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

/**
 * Custom hook to fetch contract details and associated gig information.
 *
 * Fetches the contract from GET /api/contracts/retrieve/:id/ on mount.
 * On success, uses the contract's gig UUID to fetch GET /api/gigs/retrieve/:gig_id/.
 * Returns both contract and gig with loading/error/retry states.
 *
 * Error handling:
 * - 404 → "Contrato no encontrado"
 * - 401 → redirect handled automatically by api() utility
 * - Other errors → "Error de conexión"
 */
export function useContractDetail(contractId: string): UseContractDetailReturn {
  const [contract, setContract] = useState<Contract | null>(null);
  const [gig, setGig] = useState<GigDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    // Abort any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);
    setContract(null);
    setGig(null);

    try {
      // Fetch contract
      const contractData = await api<Contract>(
        `/api/contracts/retrieve/${contractId}/`,
      );

      if (controller.signal.aborted) return;

      setContract(contractData);

      // Fetch gig using the contract's gig UUID
      const gigData = await api<GigDetail>(
        `/api/gigs/retrieve/${contractData.gig}/`,
      );

      if (controller.signal.aborted) return;

      setGig(gigData);
      setIsLoading(false);
    } catch (err) {
      if (controller.signal.aborted) return;

      if (err instanceof ApiError) {
        if (err.status === 401) {
          // 401 is handled by api() utility and redirects automatically
          return;
        }
        if (err.status === 404) {
          setError("Contrato no encontrado");
        } else {
          setError("Error de conexión");
        }
      } else {
        setError("Error de conexión");
      }
      setIsLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  const retry = () => {
    fetchData();
  };

  return {
    contract,
    gig,
    isLoading,
    error,
    retry,
  };
}
