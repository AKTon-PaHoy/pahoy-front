import { getToken } from "@/utils/auth";

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
        // 204 No Content
        if (res.status === 204) return undefined as T;
        return res.json() as Promise<T>;
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

    throw new ApiError(res.status, fieldErrors);
}
