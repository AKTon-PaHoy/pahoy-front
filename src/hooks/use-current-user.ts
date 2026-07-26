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

// Module-level cache to avoid redundant fetches across components
let cachedUser: CurrentUser | null = null;
let cachePromise: Promise<void> | null = null;

/**
 * Fetches the current authenticated user from GET /api/auth/user/
 * Caches the result at the module level to prevent redundant API calls
 * across components.
 *
 * Returns { user, isLoading, error }
 * - user: null if not yet loaded or if an error occurred
 * - isLoading: true while the initial fetch is in progress
 * - error: true if the fetch failed (401 is handled by api() utility and redirects)
 */
export function useCurrentUser(): UseCurrentUserReturn {
  const [user, setUser] = useState<CurrentUser | null>(cachedUser);
  const [isLoading, setIsLoading] = useState(!cachedUser);
  const [error, setError] = useState(false);

  useEffect(() => {
    // If already cached, use it immediately
    if (cachedUser) {
      setUser(cachedUser);
      setIsLoading(false);
      return;
    }

    // If a fetch is already in progress, wait for it
    if (cachePromise) {
      let isMounted = true;
      cachePromise.then(() => {
        if (isMounted) {
          setUser(cachedUser);
          setIsLoading(false);
        }
      });
      return () => {
        isMounted = false;
      };
    }

    // Start a new fetch
    let isMounted = true;

    const fetchUser = async () => {
      try {
        const response = await api<CurrentUser>("/api/auth/user/");
        if (isMounted) {
          cachedUser = response;
          setUser(response);
          setError(false);
        }
      } catch {
        if (isMounted) {
          setUser(null);
          setError(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    cachePromise = fetchUser().then(() => {
      cachePromise = null;
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return { user, isLoading, error };
}
