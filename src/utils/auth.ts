const TOKEN_KEY = "pahoy_token";
const API_CACHE_NAME = "api-cache";

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    clearApiCache(); // fire-and-forget for synchronous logout paths
}

export async function clearApiCache(): Promise<void> {
    if ("caches" in window) {
        await caches.delete(API_CACHE_NAME);
    }
}
