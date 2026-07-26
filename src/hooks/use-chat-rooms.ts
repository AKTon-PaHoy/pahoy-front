import { useEffect, useState } from "react";
import { api, ApiError } from "@/utils/api";

export interface ChatRoom {
  id: string;
  name: string;
  participants: string[];
  participant_names: string[];
  last_message: string | null;
  client_user: string;
  gig: string;
  is_active: boolean;
  created_at: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface UseChatRoomsReturn {
  rooms: ChatRoom[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  retry: () => void;
}

/**
 * Custom hook to fetch and manage paginated chat rooms.
 *
 * Fetches the initial page from GET /api/chat/rooms/ on mount with token auth.
 * Manages paginated state: rooms array, next URL, loading flags, error state.
 * Exposes loadMore() for infinite scroll and retry() for error recovery.
 * Prevents duplicate concurrent requests via loading flag.
 *
 * Returns:
 * - rooms: array of ChatRoom objects
 * - isLoading: true while initial load is in progress
 * - isLoadingMore: true while fetching additional pages
 * - error: null or error message string
 * - hasMore: true if more pages are available
 * - loadMore: function to fetch the next page
 * - retry: function to retry a failed fetch
 */
export function useChatRooms(): UseChatRoomsReturn {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(
    null,
  );

  // Fetch initial page on mount
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    setAbortController(controller);

    const fetchInitial = async () => {
      try {
        setError(null);
        const response = await api<PaginatedResponse<ChatRoom>>(
          "/api/chat/rooms/",
        );
        if (isMounted && !controller.signal.aborted) {
          setRooms(response.results);
          setNextUrl(response.next);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted && !controller.signal.aborted) {
          if (err instanceof ApiError) {
            if (err.status === 401) {
              // 401 is handled by api() utility and redirects automatically
              return;
            }
            setError("Error al cargar las conversaciones");
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
  }, []);

  // Cancel any in-flight requests on unmount
  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [abortController]);

  const loadMore = () => {
    if (isLoadingMore || !nextUrl) return;

    let isMounted = true;
    const controller = new AbortController();

    setIsLoadingMore(true);

    const fetchMore = async () => {
      try {
        setError(null);

        // Extract path and query from full next URL
        // nextUrl is like "http://localhost:8000/api/chat/rooms/?page=2"
        // We need to extract "/api/chat/rooms/?page=2"
        const url = new URL(nextUrl);
        const path = url.pathname + url.search;

        const response = await api<PaginatedResponse<ChatRoom>>(path);
        if (isMounted && !controller.signal.aborted) {
          setRooms((prev) => [...prev, ...response.results]);
          setNextUrl(response.next);
        }
      } catch (err) {
        if (isMounted && !controller.signal.aborted) {
          if (err instanceof ApiError) {
            if (err.status === 401) {
              return;
            }
            setError("Error al cargar más conversaciones");
          } else {
            setError("Error de conexión");
          }
        }
      } finally {
        if (isMounted) {
          setIsLoadingMore(false);
        }
      }
    };

    fetchMore();

    return () => {
      isMounted = false;
      controller.abort();
    };
  };

  const retry = () => {
    if (isLoading || isLoadingMore) return;

    let isMounted = true;
    const controller = new AbortController();

    const fetchRetry = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await api<PaginatedResponse<ChatRoom>>(
          "/api/chat/rooms/",
        );
        if (isMounted && !controller.signal.aborted) {
          setRooms(response.results);
          setNextUrl(response.next);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted && !controller.signal.aborted) {
          if (err instanceof ApiError) {
            if (err.status === 401) {
              return;
            }
            setError("Error al cargar las conversaciones");
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

  return {
    rooms,
    isLoading,
    isLoadingMore,
    error,
    hasMore: nextUrl !== null,
    loadMore,
    retry,
  };
}
