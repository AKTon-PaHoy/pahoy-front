# Implementation Plan: Service Worker Caching

## Overview

Add service worker caching to the Pa·Hoy frontend using `vite-plugin-pwa`. The implementation installs the PWA plugin with Workbox runtime caching for API GET requests, precaches static assets, integrates auth-aware cache invalidation, registers the SW from the entry point, and adds an offline connectivity indicator. No existing page components require modification.

## Tasks

- [x] 1. Install vite-plugin-pwa and configure Vite
  - [x] 1.1 Install `vite-plugin-pwa` as a dev dependency
    - Run `npm install -D vite-plugin-pwa`
    - _Requirements: 1.1_

  - [x] 1.2 Configure VitePWA plugin in `vite.config.ts`
    - Import `VitePWA` from `vite-plugin-pwa`
    - Add `VitePWA()` to the plugins array with:
      - `registerType: "autoUpdate"`
      - `devOptions: { enabled: false }`
      - `workbox.globPatterns: ["**/*.{js,css,html,png,svg,ico}"]`
      - Runtime caching rule: `urlPattern: /\/api\/.*/`, `handler: "NetworkFirst"`, `method: "GET"`, `cacheName: "api-cache"`, `expiration: { maxEntries: 50, maxAgeSeconds: 300 }`, `networkTimeoutSeconds: 3`, `cacheableResponse: { statuses: [0, 200] }`
      - Manifest: `name: "Pa·Hoy"`, `short_name: "PaHoy"`, `theme_color: "#E8590C"`, `background_color: "#FFFFFF"`, `display: "standalone"`, `start_url: "/"`
      - Icons array referencing `/icons/icon-192x192.png` (192x192) and `/icons/icon-512x512.png` (512x512, purpose: "any maskable")
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3_

  - [x] 1.3 Create PWA icon files
    - Create `public/icons/icon-192x192.png` — a 192x192 version of the app icon (can use thunderface.png resized)
    - Create `public/icons/icon-512x512.png` — a 512x512 version of the app icon
    - _Requirements: 1.3_

  - [x] 1.4 Add TypeScript declarations for virtual module
    - Add `/// <reference types="vite-plugin-pwa/client" />` to `src/vite-env.d.ts` (create if doesn't exist)
    - _Requirements: 5.1_

- [x] 2. Register service worker and integrate cache invalidation
  - [x] 2.1 Register the service worker in `src/main.tsx`
    - Import `registerSW` from `"virtual:pwa-register"`
    - Call `registerSW()` after `createRoot().render()` with:
      - `onRegisteredSW` callback that logs `"[SW] Registered:"` + URL in dev mode only
      - `onRegisterError` callback that logs `"[SW] Registration failed:"` + error in dev mode only
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 2.2 Add `clearApiCache()` to `src/utils/auth.ts`
    - Add `const API_CACHE_NAME = "api-cache"` constant
    - Export `async function clearApiCache(): Promise<void>` that calls `caches.delete(API_CACHE_NAME)` guarded by `"caches" in window`
    - Call `clearApiCache()` (fire-and-forget) inside `clearToken()`
    - _Requirements: 4.1, 4.3_

  - [x] 2.3 Update 401 handler in `src/utils/api.ts` to await cache clearing
    - Import `clearApiCache` from `@/utils/auth`
    - In both `api()` and `apiMultipart()`, change the 401 block to: `clearToken(); await clearApiCache(); window.location.href = "/";`
    - _Requirements: 4.2, 7.1, 7.2_

- [x] 3. Implement offline connectivity indicator
  - [x] 3.1 Create `src/hooks/use-online-status.ts`
    - Implement `useOnlineStatus()` hook using `useSyncExternalStore`
    - Subscribe to `window` `online` and `offline` events
    - Return `navigator.onLine` as snapshot
    - _Requirements: 6.1, 6.2_

  - [x] 3.2 Create `src/components/application/offline-indicator/offline-indicator.tsx`
    - Import `useOnlineStatus` hook and `AnimatePresence`/`motion` from `motion/react`
    - Render `motion.div` with message "Sin conexión — mostrando datos guardados" when offline
    - Style: `fixed top-0 right-0 left-0 z-50 bg-neutral-800 py-2 text-center text-sm text-white`
    - Animation: slide down on enter (y: -32→0), slide up on exit
    - Add `role="status"` and `aria-live="polite"` for accessibility
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 3.3 Render `<OfflineIndicator />` in `src/main.tsx`
    - Import and render the component at root level, inside the providers but above the router content
    - _Requirements: 6.1_

- [x] 4. Build verification checkpoint
  - Run `npm run build` to verify:
    - TypeScript compiles without errors
    - Service worker file is generated in `dist/`
    - Manifest file is generated in `dist/`
    - No existing functionality is broken
  - _Requirements: 7.1, 7.2, 7.3_

- [ ]* 5. Property-based verification
  - [ ]* 5.1 Verify cacheableResponse config excludes 401
    - Confirm `cacheableResponse.statuses` only includes `[0, 200]` — not 401
    - **Property 2: 401 responses are never cached**
    - **Validates: Requirements 2.4**

  - [ ]* 5.2 Verify cache invalidation awaits before redirect
    - Confirm `await clearApiCache()` precedes `window.location.href = "/"` in both `api()` and `apiMultipart()`
    - **Property 3: Cache invalidation completes before redirect**
    - **Validates: Requirements 4.2**

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The PWA icons (task 1.3) can be simple resized versions of `public/thunderface.png` — proper branded icons can be created later
- `devOptions: { enabled: false }` ensures no SW registers during `npm run dev` — only production builds
- The `method: "GET"` in the runtime caching rule ensures mutations (POST/PATCH/PUT/DELETE) always hit the network directly
- The `cacheableResponse.statuses: [0, 200]` filter prevents 401 responses from being cached, satisfying Req 2.4 at the Workbox level
- The offline indicator is purely informational — it doesn't prevent any user interaction
- Existing page components need zero changes — the SW operates transparently beneath `fetch()`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4"] },
    { "id": 2, "tasks": ["2.1", "2.2", "2.3", "3.1"] },
    { "id": 3, "tasks": ["3.2"] },
    { "id": 4, "tasks": ["3.3"] },
    { "id": 5, "tasks": ["4"] },
    { "id": 6, "tasks": ["5.1", "5.2"] }
  ]
}
```
