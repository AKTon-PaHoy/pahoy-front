import { useEffect, useRef, useState } from "react";

import { api, ApiError } from "@/utils/api";
import type {
  Contract,
  ContractListItem,
  PaginatedResponse,
} from "@/types/chat";

export interface UseContractsListReturn {
  contracts: ContractListItem[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  retry: () => void;
}

/**
 * Custom hook to fetch and manage paginated contracts filtered by status.
 *
 * Fetches one request per status value from GET /api/contracts/list/?status=X on mount.
 * Merges results sorted by updated_at descending with deduplication by contract ID.
 * Supports page-number pagination (20 results/page per status) with loadMore().
 * Handles loading, error, and retry states following the useChatRooms pattern.
 */
export function useContractsList(
  statuses: Contract["status"][],
): UseContractsListReturn {
  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track current page and whether there are more results per status
  const pagesRef = useRef<Record<string, number>>({});
  const hasMorePerStatusRef = useRef<Record<string, boolean>>({});
  const isLoadingMoreRef = useRef(false);

  // Stable reference to statuses to avoid re-fetching on every render
  const statusesKey = statuses.join(",");

  /** Merge, deduplicate, and sort contracts by updated_at descending */
  function mergeContracts(existing: ContractListItem[], incoming: ContractListItem[]): ContractListItem[] {
    const map = new Map<string, ContractListItem>();
    for (const c of existing) {
      map.set(c.id, c);
    }
    for (const c of incoming) {
      map.set(c.id, c);
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    );
  }

  // Fetch initial page on mount or when statuses change
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    // Reset pagination state
    const pages: Record<string, number> = {};
    const hasMorePerStatus: Record<string, boolean> = {};
    for (const status of statuses) {
      pages[status] = 1;
      hasMorePerStatus[status] = true;
    }
    pagesRef.current = pages;
    hasMorePerStatusRef.current = hasMorePerStatus;

    const fetchInitial = async () => {
      try {
        setError(null);
        setIsLoading(true);
        setContracts([]);

        const requests = statuses.map((status) =>
          api<PaginatedResponse<ContractListItem>>(
            `/api/contracts/list/?status=${encodeURIComponent(status)}`,
          ),
        );

        const responses = await Promise.all(requests);

        if (isMounted && !controller.signal.aborted) {
          let allResults: ContractListItem[] = [];

          for (let i = 0; i < statuses.length; i++) {
            const status = statuses[i];
            const response = responses[i];
            allResults = [...allResults, ...response.results];
            hasMorePerStatusRef.current[status] = response.next !== null;
          }

          setContracts(mergeContracts([], allResults));
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted && !controller.signal.aborted) {
          if (err instanceof ApiError) {
            if (err.status === 401) {
              // 401 is handled by api() utility and redirects automatically
              return;
            }
            setError("Error al cargar los contratos");
          } else {
            setError("Error de conexión");
          }
          setIsLoading(false);
        }
      }
    };

    fetchInitial();

    return () => {
      isMounted = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusesKey]);

  const loadMore = () => {
    // Check if any status still has more results
    const statusesWithMore = statuses.filter(
      (s) => hasMorePerStatusRef.current[s],
    );

    if (isLoadingMoreRef.current || statusesWithMore.length === 0) return;

    isLoadingMoreRef.current = true;
    let isMounted = true;

    const fetchMore = async () => {
      try {
        setError(null);

        // Increment page for each status that has more
        const requests = statusesWithMore.map((status) => {
          const nextPage = pagesRef.current[status] + 1;
          return api<PaginatedResponse<ContractListItem>>(
            `/api/contracts/list/?status=${encodeURIComponent(status)}&page=${nextPage}`,
          ).then((response) => ({ status, response, page: nextPage }));
        });

        const results = await Promise.all(requests);

        if (isMounted) {
          let incoming: ContractListItem[] = [];

          for (const { status, response, page } of results) {
            pagesRef.current[status] = page;
            hasMorePerStatusRef.current[status] = response.next !== null;
            incoming = [...incoming, ...response.results];
          }

          setContracts((prev) => mergeContracts(prev, incoming));
        }
      } catch (err) {
        if (isMounted) {
          if (err instanceof ApiError) {
            if (err.status === 401) {
              return;
            }
            setError("Error al cargar los contratos");
          } else {
            setError("Error de conexión");
          }
        }
      } finally {
        if (isMounted) {
          isLoadingMoreRef.current = false;
        }
      }
    };

    fetchMore();

    return () => {
      isMounted = true;
    };
  };

  const retry = () => {
    if (isLoading) return;

    let isMounted = true;
    const controller = new AbortController();

    // Reset pagination state
    const pages: Record<string, number> = {};
    const hasMorePerStatus: Record<string, boolean> = {};
    for (const status of statuses) {
      pages[status] = 1;
      hasMorePerStatus[status] = true;
    }
    pagesRef.current = pages;
    hasMorePerStatusRef.current = hasMorePerStatus;

    const fetchRetry = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setContracts([]);

        const requests = statuses.map((status) =>
          api<PaginatedResponse<ContractListItem>>(
            `/api/contracts/list/?status=${encodeURIComponent(status)}`,
          ),
        );

        const responses = await Promise.all(requests);

        if (isMounted && !controller.signal.aborted) {
          let allResults: ContractListItem[] = [];

          for (let i = 0; i < statuses.length; i++) {
            const status = statuses[i];
            const response = responses[i];
            allResults = [...allResults, ...response.results];
            hasMorePerStatusRef.current[status] = response.next !== null;
          }

          setContracts(mergeContracts([], allResults));
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted && !controller.signal.aborted) {
          if (err instanceof ApiError) {
            if (err.status === 401) {
              return;
            }
            setError("Error al cargar los contratos");
          } else {
            setError("Error de conexión");
          }
          setIsLoading(false);
        }
      }
    };

    fetchRetry();

    return () => {
      isMounted = false;
      controller.abort();
    };
  };

  const hasMore = statuses.some((s) => hasMorePerStatusRef.current[s]);

  return {
    contracts,
    isLoading,
    error,
    hasMore,
    loadMore,
    retry,
  };
}
