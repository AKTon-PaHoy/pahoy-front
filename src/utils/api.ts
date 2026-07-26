import { clearApiCache, clearToken, getToken } from "@/utils/auth";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Lightweight fetch wrapper for JSON API calls.
 * Throws an `ApiError` on non-2xx responses.
 */
export class ApiError extends Error {
    status: number;
    /** Field-level validation errors from the backend (DRF format). */
    fieldErrors: Record<string, string[]>;

    constructor(
        status: number,
        fieldErrors: Record<string, string[]>,
        message?: string,
    ) {
        super(message || "Request failed");
        this.status = status;
        this.fieldErrors = fieldErrors;
    }
}

interface RequestOptions {
    method?: string;
    body?: unknown;
    token?: string;
}

export async function api<T>(
    path: string,
    { method = "GET", body, token }: RequestOptions = {},
): Promise<T> {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    const authToken = token || getToken();
    if (authToken) {
        headers["Authorization"] = `Token ${authToken}`;
    }

    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (res.ok) {
        // 204 No Content or empty body
        if (res.status === 204) return undefined as T;
        const text = await res.text();
        if (!text) return undefined as T;
        return JSON.parse(text) as T;
    }

    // Try to parse validation errors
    let fieldErrors: Record<string, string[]> = {};
    try {
        const data = await res.json();
        if (typeof data === "object" && data !== null) {
            // DRF ValidationError format: { field: ["error1", ...] }
            // or ErrorResponse format: { detail: "..." }
            if ("detail" in data) {
                fieldErrors = { _general: [data.detail] };
            } else {
                fieldErrors = data as Record<string, string[]>;
            }
        }
    } catch {
        // Response wasn't JSON
    }

    // If 401 and we had a token, it's expired — clear and redirect to splash
    if (res.status === 401 && getToken()) {
        clearToken();
        await clearApiCache();
        window.location.href = "/";
    }

    throw new ApiError(res.status, fieldErrors);
}

/**
 * Fetch wrapper for multipart/form-data requests (e.g. file uploads).
 * Does NOT set Content-Type — the browser adds it with the boundary automatically.
 * Throws an `ApiError` on non-2xx responses.
 */
export async function apiMultipart<T>(
    path: string,
    { method = "PATCH", body }: { method?: string; body: FormData },
): Promise<T> {
    const headers: Record<string, string> = {};

    const authToken = getToken();
    if (authToken) {
        headers["Authorization"] = `Token ${authToken}`;
    }

    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body,
    });

    if (res.ok) {
        // 204 No Content or empty body
        if (res.status === 204) return undefined as T;
        const text = await res.text();
        if (!text) return undefined as T;
        return JSON.parse(text) as T;
    }

    // Try to parse validation errors
    let fieldErrors: Record<string, string[]> = {};
    try {
        const data = await res.json();
        if (typeof data === "object" && data !== null) {
            if ("detail" in data) {
                fieldErrors = { _general: [data.detail] };
            } else {
                fieldErrors = data as Record<string, string[]>;
            }
        }
    } catch {
        // Response wasn't JSON
    }

    // If 401 and we had a token, it's expired — clear and redirect to splash
    if (res.status === 401 && getToken()) {
        clearToken();
        await clearApiCache();
        window.location.href = "/";
    }

    throw new ApiError(res.status, fieldErrors);
}

/** Check if a stored token is still valid by hitting /api/auth/user/ */
export async function validateToken(): Promise<boolean> {
    const token = getToken();
    if (!token) return false;

    try {
        await api("/api/auth/user/");
        return true;
    } catch {
        return false;
    }
}
