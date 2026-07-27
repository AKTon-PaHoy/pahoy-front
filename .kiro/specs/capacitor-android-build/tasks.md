# Implementation Plan: Capacitor Android Build

## Overview

This plan wraps the existing Pa·Hoy React + Vite + Tailwind PWA in a Capacitor 6 native Android shell. Tasks are ordered to establish the Capacitor foundation first, then layer native features (splash, icons, status bar, deep links), and finally wire everything together with build scripts and verification.

## Tasks

- [x] 1. Install Capacitor dependencies and create configuration
  - [x] 1.1 Install Capacitor core packages and plugins
    - Run `npm install @capacitor/core @capacitor/app @capacitor/browser @capacitor/splash-screen @capacitor/status-bar`
    - Run `npm install -D @capacitor/cli @capacitor/assets`
    - _Requirements: 1.1, 4.1, 7.1, 8.1_

  - [x] 1.2 Create `capacitor.config.ts` at project root
    - Set `appId` to `"com.pahoy.app"`, `appName` to `"Pa·Hoy"`, `webDir` to `"dist"`
    - Configure `server.androidScheme` to `"https"`
    - Configure `plugins.SplashScreen` with `launchShowDuration: 2000`, `launchAutoHide: true`, `launchFadeOutDuration: 300`, `backgroundColor: "#FFFFFF"`, `androidSplashResourceName: "splash"`, `androidScaleType: "CENTER_INSIDE"`, `showSpinner: false`
    - _Requirements: 1.2, 1.4, 4.2, 4.3, 4.4_

  - [x] 1.3 Update `vite.config.ts` to set `base: "./"`
    - Add `base: "./"` to the Vite config so assets use relative paths inside the Capacitor WebView
    - _Requirements: 9.3_

  - [x] 1.4 Update `index.html` viewport meta tag
    - Change viewport meta to include `viewport-fit=cover`: `content="width=device-width, initial-scale=1.0, viewport-fit=cover"`
    - _Requirements: 3.3_

- [x] 2. Generate Android project and configure native settings
  - [x] 2.1 Initialize the Android platform
    - Run `npx cap add android` to generate the `android/` directory with the Gradle-based project
    - Ensure the generated `android/` directory is NOT in `.gitignore` (per design decision to commit it for CI and custom manifest entries)
    - _Requirements: 1.3, 9.4_

  - [x] 2.2 Configure Android SDK versions and Java in `android/variables.gradle`
    - Set `minSdkVersion = 23`, `compileSdkVersion = 34`, `targetSdkVersion = 34`
    - Set `javaVersion = JavaVersion.VERSION_17`
    - _Requirements: 2.3, 2.4_

  - [x] 2.3 Set app label in `android/app/src/main/res/values/strings.xml`
    - Set the `app_name` string resource to `"Pa·Hoy"`
    - _Requirements: 2.2_

  - [x] 2.4 Configure navigation bar styling in `android/app/src/main/res/values/styles.xml`
    - Add `<item name="android:navigationBarColor">#FFFFFF</item>` and `<item name="android:windowLightNavigationBar">true</item>` to the app theme
    - _Requirements: 8.3_

- [x] 3. Checkpoint - Verify base Capacitor setup
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Create native initialization module and deep link handler
  - [x] 4.1 Create `src/utils/capacitor.ts` with platform detection and initialization
    - Implement `isNative()` function using `Capacitor.isNativePlatform()`
    - Implement `initializeNativeApp()` that calls `StatusBar.setStyle({ style: Style.Light })` and `StatusBar.setBackgroundColor({ color: "#FFFFFF" })`
    - Guard all native calls with `isNative()` check for graceful no-op in web context
    - _Requirements: 8.2, 8.4, 8.5_

  - [x] 4.2 Implement deep link listener in `src/utils/capacitor.ts`
    - Implement `setupDeepLinkListener(navigate)` that listens to `App.addListener("appUrlOpen", ...)` events
    - Extract URL pathname and call `navigate(path)` for supported patterns: `/gig/:id`, `/contracts/:id`, `/messages/:roomId`
    - Ignore URLs that don't match any supported pattern
    - _Requirements: 7.2, 7.3, 7.4_

  - [x] 4.3 Implement external URL handler in `src/utils/capacitor.ts`
    - Implement `openExternalUrl(url)` that uses `Browser.open({ url })` on native, or `window.open(url, "_blank")` on web
    - _Requirements: 3.4_

  - [ ]* 4.4 Write property test for deep link URL path extraction
    - **Property 1: Deep link URL path extraction**
    - Generate random valid IDs (alphanumeric, UUID, slugs) for `/gig/:id`, `/contracts/:id`, `/messages/:roomId` patterns
    - Construct full `https://pahoy.app/...` URLs and verify the handler extracts the correct pathname and passes it to the navigate function
    - Minimum 100 iterations using `fast-check`
    - **Validates: Requirements 7.2, 7.3, 7.4**

- [x] 5. Integrate deep links and native init into the app
  - [x] 5.1 Wire `initializeNativeApp()` into `src/main.tsx`
    - Call `initializeNativeApp()` in a `useEffect` at app startup (inside a new wrapper component within BrowserRouter context)
    - _Requirements: 8.4, 8.5_

  - [x] 5.2 Wire deep link listener with auth-aware navigation in `src/main.tsx`
    - Add `setupDeepLinkListener` call with `useNavigate` hook
    - If `getToken()` returns null when a deep link arrives, store target path in `sessionStorage.setItem("deepLinkTarget", path)` and redirect to `/login`
    - After login, check `sessionStorage.getItem("deepLinkTarget")` and navigate to stored path
    - _Requirements: 7.6_

  - [ ]* 5.3 Write property test for unauthenticated deep link deferred navigation
    - **Property 2: Unauthenticated deep link deferred navigation**
    - Generate random valid deep link paths, mock `getToken()` to return null
    - Verify the path is stored in `sessionStorage` and navigate is called with `/login`
    - Minimum 100 iterations using `fast-check`
    - **Validates: Requirements 7.6**

- [x] 6. Configure Android deep link intent filters
  - [x] 6.1 Add App Links intent filters to `AndroidManifest.xml`
    - Add `<intent-filter android:autoVerify="true">` entries for `https://pahoy.app/gig/`, `https://pahoy.app/contracts/`, and `https://pahoy.app/messages/` path prefixes
    - Each filter includes `VIEW` action, `DEFAULT` + `BROWSABLE` categories, and `<data>` element with `scheme="https"`, `host="pahoy.app"`, and the appropriate `pathPrefix`
    - _Requirements: 7.5_

- [x] 7. Generate app icons and splash screen assets
  - [x] 7.1 Generate Android adaptive icon assets
    - Use `@capacitor/assets` CLI to generate icons from `public/icons/icon-512x512.png`
    - Produce `ic_launcher` and `ic_launcher_round` for all density buckets (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
    - Configure adaptive icon foreground and background layers
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 7.2 Generate splash screen assets
    - Use `@capacitor/assets` CLI to generate splash screen resources from `public/splash-logo.png`
    - Produce `splash.png` for all Android density buckets
    - Place in appropriate `drawable-*` resource directories
    - _Requirements: 4.5_

- [x] 8. Add npm build scripts to `package.json`
  - [x] 8.1 Add Capacitor npm scripts
    - Add `"cap:sync": "npx cap sync"` script
    - Add `"cap:open": "npx cap open android"` script
    - Add `"cap:build": "npm run build && npx cap sync && cd android && ./gradlew assembleDebug"` script
    - _Requirements: 9.1, 6.3_

- [x] 9. Checkpoint - Full build verification
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. End-to-end build pipeline validation
  - [ ]* 10.1 Write unit tests for `src/utils/capacitor.ts`
    - Test `isNative()` returns correct values when mocking `Capacitor.isNativePlatform()`
    - Test `initializeNativeApp()` calls `StatusBar.setStyle` and `StatusBar.setBackgroundColor` with correct args when native
    - Test `initializeNativeApp()` is a no-op when not native
    - Test `openExternalUrl()` calls `Browser.open` on native and `window.open` on web
    - Test deep link listener ignores URLs that don't match supported patterns
    - _Requirements: 8.2, 8.4, 3.4, 7.2, 7.3, 7.4_

  - [x] 10.2 Run `npx cap sync` and verify assets are copied
    - Execute `npm run build` followed by `npx cap sync`
    - Verify `android/app/src/main/assets/public/` contains the built web assets
    - Verify Vite output in `dist/` uses relative paths (no leading `/` on asset references)
    - _Requirements: 6.1, 9.2, 9.3_

- [x] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The `android/` directory is committed to git (not gitignored) per design decision for CI builds and custom manifest entries
- Manual device testing (splash screen timing, status bar appearance, deep link via `adb`) is recommended after the build pipeline is functional but is not included as a task since it cannot be automated by a coding agent

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4"] },
    { "id": 2, "tasks": ["2.1", "4.1"] },
    { "id": 3, "tasks": ["2.2", "2.3", "2.4", "4.2", "4.3"] },
    { "id": 4, "tasks": ["4.4", "5.1", "6.1"] },
    { "id": 5, "tasks": ["5.2", "5.3", "7.1", "7.2"] },
    { "id": 6, "tasks": ["8.1"] },
    { "id": 7, "tasks": ["10.1", "10.2"] }
  ]
}
```
