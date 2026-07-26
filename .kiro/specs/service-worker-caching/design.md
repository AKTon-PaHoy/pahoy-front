# Design Document: Service Worker Caching

## Architecture Overview

The service worker is generated at build time by `vite-plugin-pwa` (Workbox under the hood). It intercepts all fetch requests in the browser. The architecture has three layers:

1. **Build-time config** (`vite.config.ts`) — plugin setup, manifest generation, Workbox runtime caching rules
2. **Registration** (`src/main.tsx`) — registers SW using `virtual:pwa-register`
3. **Application integration** — cache invalidation in auth utilities + offline indicator UI

No existing components change behavior. The SW layer operates beneath the existing `fetch()` calls transparently.

### Component Hierarchy

```
vite.config.ts (VitePWA plugin)
├── Generates service-worker.js (Workbox)
│   ├── Precache: static assets (JS, CSS, HTML, images)
│   └── Runtime Cache: GET /api/* → NetworkFirst (3s timeout)
├── Generates manifest.webmanifest
└── Provides virtual:pwa-register module

src/main.tsx
├── registerSW() from virtual:pwa-register
└── <OfflineIndicator /> (renders at root level)

src/utils/auth.ts
└── clearToken() → clearApiCache() → caches.delete("api-cache")
```

## Components

### 1. Vite PWA Configuration (`vite.config.ts`)

The `VitePWA` plugin is added to the existing Vite plugins array. It handles:
- Generating the service worker with Workbox runtime caching rules
- Producing the web app manifest (`manifest.webmanifest`)
- Injecting the precache manifest into the service worker at build time
- Disabling itself in development mode (`devOptions: { enabled: false }`)

```typescript
import { VitePWA } from "vite-plugin-pwa";

// Added to plugins array:
VitePWA({
    registerType: "autoUpdate",
    devOptions: { enabled: false },
    workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
        runtimeCaching: [
            {
                urlPattern: /\/api\/.*/,
                handler: "NetworkFirst",
                method: "GET",
                options: {
                    cacheName: "api-cache",
                    expiration: {
                        maxEntries: 50,
                        maxAgeSeconds: 300,
                    },
                    networkTimeoutSeconds: 3,
                    cacheableResponse: {
                        statuses: [0, 200],
                    },
                },
            },
        ],
    },
    manifest: {
        name: "Pa·Hoy",
        short_name: "PaHoy",
        description: "Conecta con talento local en tu comunidad",
        theme_color: "#E8590C",
        background_color: "#FFFFFF",
        display: "standalone",
        start_url: "/",
        icons: [
            { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
            { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
    },
})
```

**Key decisions:**
- `cacheableResponse.statuses: [0, 200]` ensures 401 responses are never cached
- `method: "GET"` ensures only GET requests hit the runtime cache; POST/PATCH/PUT/DELETE pass through untouched
- `networkTimeoutSeconds: 3` provides the fallback threshold before serving stale data

### 2. Service Worker Registration (`src/main.tsx`)

Registration is done after `createRoot().render()` using the virtual module provided by the plugin. The `registerType: "autoUpdate"` means new SW versions activate silently without user prompts.

```typescript
import { registerSW } from "virtual:pwa-register";

// Called after createRoot().render()
const updateSW = registerSW({
    onRegisteredSW(swUrl, registration) {
        if (import.meta.env.DEV) {
            console.log("[SW] Registered:", swUrl);
        }
    },
    onRegisterError(error) {
        if (import.meta.env.DEV) {
            console.error("[SW] Registration failed:", error);
        }
    },
});
```

If registration fails, the app continues without caching. No error UI is shown to the user.

### 3. Auth Cache Invalidation (`src/utils/auth.ts`)

The existing `clearToken()` function is extended to also clear the API cache. This ensures that when a user logs out or receives a 401, no stale user-specific data remains cached.

```typescript
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
```

The `clearApiCache` function is also exported for use in `src/utils/api.ts` where the 401 handler needs to `await` cache deletion before redirecting:

```typescript
// In src/utils/api.ts, the 401 block becomes:
if (res.status === 401 && getToken()) {
    clearToken();
    await clearApiCache();
    window.location.href = "/";
}
```

The `clearApiCache` import comes from `@/utils/auth`. The `"caches" in window` guard ensures no-op in environments where Cache Storage API is unavailable.

### 4. `useOnlineStatus` Hook (`src/hooks/use-online-status.ts`)

A custom hook that uses `useSyncExternalStore` to subscribe to the browser's online/offline events. This is the React 18+ recommended pattern for subscribing to external stores.

```typescript
import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
    window.addEventListener("online", callback);
    window.addEventListener("offline", callback);
    return () => {
        window.removeEventListener("online", callback);
        window.removeEventListener("offline", callback);
    };
}

function getSnapshot() {
    return navigator.onLine;
}

export function useOnlineStatus(): boolean {
    return useSyncExternalStore(subscribe, getSnapshot);
}
```

### 5. `OfflineIndicator` Component (`src/components/application/offline-indicator/offline-indicator.tsx`)

A small banner that appears at the top of the viewport when the user loses connectivity. Uses `motion/react` for entrance/exit animations consistent with the project's animation patterns.

```typescript
import { AnimatePresence, motion } from "motion/react";
import { useOnlineStatus } from "@/hooks/use-online-status";

export function OfflineIndicator() {
    const isOnline = useOnlineStatus();

    return (
        <AnimatePresence>
            {!isOnline && (
                <motion.div
                    initial={{ opacity: 0, y: -32 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -32 }}
                    transition={{ duration: 0.2 }}
                    className="fixed top-0 right-0 left-0 z-50 bg-neutral-800 py-2 text-center text-sm text-white"
                    role="status"
                    aria-live="polite"
                >
                    Sin conexión — mostrando datos guardados
                </motion.div>
            )}
        </AnimatePresence>
    );
}
```

The component:
- Uses `fixed` positioning so it overlays page content without displacing layout
- Uses `z-50` to appear above all other elements
- Does not trap focus or block pointer events on the rest of the page
- Uses `role="status"` + `aria-live="polite"` for screen reader announcements

### 6. TypeScript Declarations

The `virtual:pwa-register` module needs type declarations. Added to the existing `src/vite-env.d.ts`:

```typescript
/// <reference types="vite-plugin-pwa/client" />
```

## Interfaces & Data Models

### Cache Configuration

```typescript
interface RuntimeCacheConfig {
    urlPattern: RegExp;
    handler: "NetworkFirst" | "CacheFirst" | "StaleWhileRevalidate";
    method: "GET";
    options: {
        cacheName: string;
        expiration: {
            maxEntries: number;
            maxAgeSeconds: number;
        };
        networkTimeoutSeconds: number;
        cacheableResponse: {
            statuses: number[];
        };
    };
}
```

### PWA Manifest

```typescript
interface PWAManifest {
    name: string;
    short_name: string;
    description: string;
    theme_color: string;
    background_color: string;
    display: "standalone" | "fullscreen" | "minimal-ui" | "browser";
    start_url: string;
    icons: Array<{
        src: string;
        sizes: string;
        type: string;
        purpose?: string;
    }>;
}
```

### Hook Return Type

```typescript
// useOnlineStatus returns a simple boolean
type OnlineStatus = boolean; // true = online, false = offline
```

## Data Flow

### Normal Request (Online)

```
Page Component → api() → fetch() → Service Worker → Network → Response
                                            ↓ (GET 200)
                                    Store in api-cache
```

### Cached Fallback (Offline / Timeout)

```
Page Component → api() → fetch() → Service Worker → Network (timeout 3s)
                                            ↓
                                    Serve from api-cache
```

### Logout / 401 Cache Invalidation

```
api() receives 401 → clearToken() → clearApiCache() → caches.delete("api-cache") → redirect "/"
```

### Static Asset (Precached)

```
Browser → Service Worker → Precache Storage → Immediate response (no network)
```

### Mutation Requests (POST/PATCH/PUT/DELETE)

```
Page Component → api() → fetch() → Service Worker → Network (passthrough, no caching)
```

## Error Handling

| Scenario | Behavior |
|----------|----------|
| SW registration fails | Logged in dev console, app continues without caching capabilities |
| Network timeout (3s) on GET /api/* | SW serves cached response if available |
| No cached response available offline | `fetch()` throws network error → `api()` throws `ApiError` → page shows its own error state |
| Cache Storage API unavailable | `clearApiCache()` safely no-ops via `"caches" in window` check |
| POST/PATCH/PUT/DELETE offline | Fails immediately (no caching for mutations) — existing error handling in pages applies |
| 401 response on GET | Not stored in cache (filtered by `cacheableResponse.statuses: [0, 200]`) |
| SW update available | Auto-activates silently via `registerType: "autoUpdate"` |

## Accessibility

- Offline indicator uses `role="status"` and `aria-live="polite"` so screen readers announce connectivity changes without interrupting the user
- The banner does not trap focus or block interaction with underlying content
- No other accessibility impact — all changes are at the infrastructure/network layer
- Existing page components remain unchanged and retain their current accessibility features

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Only GET requests are cached

*For any* request intercepted by the Service Worker, if the HTTP method is NOT GET, the response SHALL NOT be stored in the API Cache.

**Validates: Requirements 2.2**

### Property 2: 401 responses are never cached

*For any* GET request to `/api/*` that returns HTTP status 401, the response SHALL NOT be stored in the API Cache.

**Validates: Requirements 2.4**

### Property 3: Cache invalidation completes before redirect

*For any* 401 response that triggers logout, the `caches.delete("api-cache")` promise SHALL resolve before `window.location.href` is assigned.

**Validates: Requirements 4.2**

### Property 4: Offline indicator reflects navigator.onLine

*For any* state of `navigator.onLine`, the OfflineIndicator component SHALL be visible if and only if `navigator.onLine === false`.

**Validates: Requirements 6.1, 6.2**

### Property 5: Cache invalidation only targets API cache

*For any* invocation of `clearApiCache()`, only the cache named `"api-cache"` SHALL be deleted — all other caches (including the precache) SHALL remain intact.

**Validates: Requirements 4.1, 4.3**
