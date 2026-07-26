import { useEffect, useState } from "react";
import { api } from "@/utils/api";

interface CurrentUser {
  id: string; // User UUID
  profileId: string; // Profile UUID (used as talent FK in gigs)
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
    const [userResponse, profileResponse] = await Promise.all([
      api<Record<string, unknown>>("/api/auth/user/"),
      api<Record<string, unknown>>("/api/profile/retrieve/"),
    ]);
    // Normalize: accept id, pk, or uuid from the API
    const userId =
      (userResponse.id as string) ||
      (userResponse.pk as string) ||
      (userResponse.uuid as string) ||
      "";
    const profileId = (profileResponse.id as string) || "";
    cachedUser = { id: userId, profileId };
  } catch {
    cachedUser = null;
  }
  fetchPromise = null;
  notifyAll(cachedUser);
  return cachedUser;
}

/**
 * Fetches the current authenticated user from GET /api/auth/user/
 * and their profile from GET /api/profile/retrieve/.
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
