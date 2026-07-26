# Requirements Document

## Introduction

This feature adds service worker caching to the Pa·Hoy frontend using `vite-plugin-pwa`. The goal is to cache API GET requests for faster repeat loads and basic offline data availability, precache static assets for instant app shell loads, and handle auth-aware cache invalidation so stale user-specific data is never served to a different user. The service worker only activates in production builds to avoid interference with the development workflow.

## Glossary

- **Service_Worker**: A background script registered by the browser that intercepts network requests and can serve cached responses
- **PWA_Plugin**: The `vite-plugin-pwa` Vite plugin that generates and configures the service worker and web app manifest during production builds
- **API_Cache**: A named Workbox runtime cache (`api-cache`) that stores responses from GET requests to `/api/*` endpoints
- **NetworkFirst_Strategy**: A caching strategy that attempts the network request first and falls back to the cache if the network is unavailable or times out
- **Precache**: Static assets (HTML, JS, CSS, images) bundled into the service worker at build time for immediate availability on repeat visits
- **Web_App_Manifest**: A JSON file describing the PWA metadata (name, icons, theme color) used by the browser for installation and display
- **SW_Registration**: The process of registering the service worker from the application entry point using the virtual module provided by vite-plugin-pwa
- **Auth_Token**: The `pahoy_token` value stored in localStorage used to authenticate API requests via the `Authorization` header
- **Offline_Indicator**: A UI element (toast or banner) displayed when the browser detects loss of network connectivity

## Requirements

### Requirement 1: PWA Plugin Installation and Configuration

**User Story:** As a developer, I want the PWA plugin configured in the Vite build pipeline, so that a service worker and web app manifest are generated automatically on production builds.

#### Acceptance Criteria

1. THE PWA_Plugin SHALL be added as a dev dependency in `package.json` and configured in `vite.config.ts` with `registerType` set to `"autoUpdate"`.
2. THE PWA_Plugin SHALL generate a Web_App_Manifest containing the application name "Pa·Hoy", a short name "PaHoy", a theme color of `#E8590C`, a background color of `#FFFFFF`, and `display` set to `"standalone"`.
3. THE PWA_Plugin SHALL include at least one icon of approximately 192x192 pixels and one of approximately 512x512 pixels in the generated Web_App_Manifest.
4. WHILE the application is running in development mode (`npm run dev`), THE PWA_Plugin SHALL NOT register the Service_Worker.

### Requirement 2: Runtime API Caching

**User Story:** As a user, I want API responses to load faster on repeat visits, so that I experience snappy navigation even on slow connections.

#### Acceptance Criteria

1. WHEN the Service_Worker intercepts a GET request matching the URL pattern `/api/*`, THE Service_Worker SHALL apply the NetworkFirst_Strategy with a network timeout of 3 seconds before falling back to the API_Cache.
2. WHEN the Service_Worker intercepts a POST, PATCH, PUT, or DELETE request, THE Service_Worker SHALL forward the request directly to the network without caching the response.
3. THE API_Cache SHALL store a maximum of 50 entries and automatically expire entries older than 300 seconds (5 minutes).
4. WHEN a cached GET response has a status code of 401, THE Service_Worker SHALL NOT store that response in the API_Cache.

### Requirement 3: Static Asset Precaching

**User Story:** As a user, I want the app shell to load instantly on repeat visits, so that I can start using the app without waiting for network resources.

#### Acceptance Criteria

1. THE PWA_Plugin SHALL precache all build-generated assets including the HTML entry point, JavaScript bundles, and CSS files using the Vite build output glob patterns.
2. THE PWA_Plugin SHALL precache the splash logo (`/splash-logo.png`) and the thunderface image (`/thunderface.png`) from the `public/` directory.
3. WHEN a precached asset is requested, THE Service_Worker SHALL serve it from the cache immediately without a network request.

### Requirement 4: Auth-Aware Cache Invalidation

**User Story:** As a user, I want my cached data cleared when I log out, so that another user on the same device does not see my private information.

#### Acceptance Criteria

1. WHEN the Auth_Token is removed from localStorage (user logs out), THE application SHALL delete all entries in the API_Cache.
2. WHEN a 401 response is received and triggers token clearance and redirect to `/`, THE application SHALL await deletion of all entries in the API_Cache before executing the redirect.
3. THE application SHALL NOT modify or delete precached static assets during cache invalidation — only the API_Cache is cleared.

### Requirement 5: Service Worker Registration

**User Story:** As a developer, I want the service worker registered from the app entry point using the plugin's virtual module, so that registration is consistent and maintainable.

#### Acceptance Criteria

1. THE application SHALL register the Service_Worker from `src/main.tsx` using the `virtual:pwa-register` module provided by the PWA_Plugin.
2. WHEN a new Service_Worker version is available, THE SW_Registration SHALL activate the update automatically without prompting the user (silent auto-update).
3. WHEN the Service_Worker registers successfully or fails, THE application SHALL log the outcome to the browser console in development builds only.
4. IF the Service_Worker registration fails, THEN THE application SHALL continue normal operation without caching capabilities.

### Requirement 6: Offline Connectivity Indicator

**User Story:** As a user, I want to know when I am viewing cached data because I lost connectivity, so that I understand the information may not be current.

#### Acceptance Criteria

1. WHEN the browser `navigator.onLine` property transitions from `true` to `false`, THE application SHALL display the Offline_Indicator as a non-intrusive banner or toast with the message "Sin conexión — mostrando datos guardados".
2. WHEN the browser `navigator.onLine` property transitions from `false` to `true`, THE application SHALL immediately hide the Offline_Indicator.
3. THE Offline_Indicator SHALL be positioned at the top of the viewport, above all page content, and styled with `bg-neutral-800 text-white text-sm text-center py-2`.
4. THE Offline_Indicator SHALL NOT block user interaction with the application.

### Requirement 7: Compatibility with Existing Auth Flow

**User Story:** As a developer, I want the service worker caching to be transparent to existing page components and auth handling, so that no existing functionality is broken.

#### Acceptance Criteria

1. THE Service_Worker SHALL NOT modify the request headers or body of any intercepted request — the Auth_Token header added by `src/utils/api.ts` must pass through unchanged.
2. WHEN the `api()` wrapper in `src/utils/api.ts` receives a 401 response, THE existing `clearToken()` and redirect logic SHALL execute as before without interference from the Service_Worker.
3. THE Service_Worker caching layer SHALL operate transparently — no existing page component or hook requires modification to benefit from caching.
