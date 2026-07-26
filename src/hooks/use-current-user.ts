import { useEffect, useState } from "react";
import { api } from "@/utils/api";

interface CurrentUser {
  id: string; // UUID
}

interface UseCurrentUserReturn {
  user: CurrentUser | null;
  isLoading: boolean;
  error: boolean;
}

// Module-level store
let cachedUser: CurrentUser | null = null;
let fetchPromise: Promise<CurrentUser | null> | null = null;
const subscribers = new Set<(user: CurrentUser | null) => void>();

function notifyAll(user: CurrentUser | null) {
  subscribers.forEach((cb) => cb(user));
}

async function doFetch(): Promise<CurrentUser | null> {
  try {
    const response = await api<Record<string, unknown>>("/api/auth/user/");
    // Normalize: accept id, pk, or uuid from the API
    const userId =
      (response.id as string) ||
      (response.pk as string) ||
      (response.uuid as string) ||
      "";
    cachedUser = { id: userId };
  } catch {
    cachedUser = null;
  }
  fetchPromise = null;
  notifyAll(cachedUser);
  return cachedUser;
}

/**
 * Fetches the current authenticated user from GET /api/auth/user/
 * Caches at module level. All mounted instances are notified on fetch completion.
 */
export function useCurrentUser(): UseCurrentUserReturn {
  const [user, setUser] = useState<CurrentUser | null>(cachedUser);
  const [isLoading, setIsLoading] = useState(!cachedUser);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Subscribe to future updates
    const handler = (newUser: CurrentUser | null) => {
      setUser(newUser);
      setIsLoading(false);
      setError(newUser === null);
    };
    subscribers.add(handler);

    // If already cached, use immediately
    if (cachedUser) {
      setUser(cachedUser);
      setIsLoading(false);
      return () => {
        subscribers.delete(handler);
      };
    }

    // If fetch is in progress, just wait for notification
    if (fetchPromise) {
      return () => {
        subscribers.delete(handler);
      };
    }

    // Start fresh fetch
    fetchPromise = doFetch();

    return () => {
      subscribers.delete(handler);
    };
  }, []);

  return { user, isLoading, error };
}
