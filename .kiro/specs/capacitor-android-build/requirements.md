# Requirements Document

## Introduction

This feature wraps the existing Pa·Hoy React + Vite + Tailwind PWA in a Capacitor native shell to produce an Android APK suitable for publishing on Google Play. The integration must preserve the current PWA behavior (auth, navigation, safe areas) while adding native capabilities such as a splash screen, app icon, deep linking, and status bar styling.

## Glossary

- **Capacitor**: A cross-platform native runtime by Ionic that wraps web apps in a native WebView container for iOS and Android distribution.
- **WebView**: The native Android component that renders the web application inside the native shell.
- **APK**: Android Package Kit, the file format used to distribute and install applications on Android devices.
- **Deep_Link**: A URL that navigates directly to a specific screen within the native application.
- **Splash_Screen**: The native launch screen displayed while the application initializes.
- **Status_Bar**: The system UI bar at the top of the Android screen showing time, battery, and notifications.
- **Navigation_Bar**: The system UI bar at the bottom of the Android screen containing back, home, and recents buttons.
- **Build_Pipeline**: The sequence of commands that transforms source code into a deployable Android project.
- **Safe_Area**: Screen regions not obscured by system UI elements (status bar, navigation bar, notches).
- **Cap_Sync**: The `npx cap sync` command that copies web assets into the native project and syncs plugin configurations.

## Requirements

### Requirement 1: Capacitor Installation and Initialization

**User Story:** As a developer, I want Capacitor installed and configured in the project, so that I can build native Android packages from the existing web app.

#### Acceptance Criteria

1. THE Build_Pipeline SHALL include `@capacitor/core` and `@capacitor/cli` as project dependencies.
2. THE Build_Pipeline SHALL include a `capacitor.config.ts` file at the project root with `appId` set to a reverse-domain package identifier, `appName` set to "Pa·Hoy", and `webDir` set to "dist".
3. WHEN `npx cap init` has been executed, THE Build_Pipeline SHALL produce an `android/` directory at the project root containing a valid Gradle-based Android project.
4. THE Build_Pipeline SHALL configure the Capacitor `server` section to use the app's existing `BrowserRouter` routing without hash-based URLs.

### Requirement 2: Native Android Project Configuration

**User Story:** As a developer, I want the native Android project correctly configured with the app identity, so that it can be published under the correct name and package.

#### Acceptance Criteria

1. THE Build_Pipeline SHALL set the Android `applicationId` to a valid reverse-domain identifier (e.g., `com.pahoy.app`).
2. THE Build_Pipeline SHALL set the Android app label to "Pa·Hoy" in the `strings.xml` resource file.
3. THE Build_Pipeline SHALL target a minimum Android SDK version of 23 (Android 6.0) and a compile SDK version of 34 or higher.
4. THE Build_Pipeline SHALL configure the Android project to use Java 17 or Kotlin as the build language.

### Requirement 3: Web App Compatibility in WebView

**User Story:** As a user, I want the existing app to function identically inside the native shell, so that I have the same experience as in the browser.

#### Acceptance Criteria

1. WHILE the app runs inside the Capacitor WebView, THE WebView SHALL retain access to `localStorage` for authentication token persistence.
2. WHILE the app runs inside the Capacitor WebView, THE WebView SHALL render all existing routes (`/home`, `/search`, `/gig/:id`, `/contracts`, `/contracts/:id`, `/messages`, `/messages/:roomId`, `/profile`) without 404 errors.
3. WHILE the app runs inside the Capacitor WebView, THE WebView SHALL apply safe-area insets so that content using `pb-safe` padding is not obscured by the system Navigation_Bar.
4. IF the WebView encounters a navigation to an external URL, THEN THE WebView SHALL open the URL in the device's default browser rather than within the app.
5. WHILE the app runs inside the Capacitor WebView, THE WebView SHALL execute the existing service worker registration without errors, gracefully handling the native environment.

### Requirement 4: Splash Screen Configuration

**User Story:** As a user, I want to see a branded splash screen when launching the app, so that the app feels polished and professional.

#### Acceptance Criteria

1. THE Build_Pipeline SHALL include the `@capacitor/splash-screen` plugin as a project dependency.
2. WHEN the application launches, THE Splash_Screen SHALL display the app logo from `public/splash-logo.png` centered on a white background.
3. WHEN the web application finishes loading, THE Splash_Screen SHALL automatically dismiss.
4. THE Splash_Screen SHALL display for a minimum of 1 second and a maximum of 3 seconds to prevent flicker and avoid excessive wait time.
5. THE Build_Pipeline SHALL generate appropriately sized splash screen assets for Android density buckets (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi) from the source image.

### Requirement 5: App Icon Configuration

**User Story:** As a user, I want to see a recognizable app icon on my home screen, so that I can easily find and launch the app.

#### Acceptance Criteria

1. THE Build_Pipeline SHALL generate Android adaptive icon assets (foreground and background layers) from the source icon at `public/icons/icon-512x512.png`.
2. THE Build_Pipeline SHALL produce icon assets for all required Android density buckets (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi).
3. THE Build_Pipeline SHALL configure the `ic_launcher` and `ic_launcher_round` resources in the Android project manifest.

### Requirement 6: Debug APK Build

**User Story:** As a developer, I want to produce a debug APK, so that I can install and test the app on physical Android devices.

#### Acceptance Criteria

1. WHEN the developer runs `npm run build` followed by `npx cap sync`, THE Build_Pipeline SHALL copy the production web assets from `dist/` into the Android project's assets directory.
2. WHEN the developer runs the Gradle `assembleDebug` task in the `android/` directory, THE Build_Pipeline SHALL produce a signed debug APK file.
3. THE Build_Pipeline SHALL include an npm script (e.g., `cap:build`) that automates the sequence of web build, cap sync, and Gradle assembleDebug into a single command.
4. THE Build_Pipeline SHALL produce an APK smaller than 30 MB for the debug build.

### Requirement 7: Deep Linking

**User Story:** As a user, I want to open shared links directly in the app, so that I can navigate to specific gigs, contracts, or messages without manually searching.

#### Acceptance Criteria

1. THE Build_Pipeline SHALL include the `@capacitor/app` plugin as a project dependency for handling app URL events.
2. WHEN the device receives a deep link matching the pattern `https://pahoy.app/gig/:id`, THE Deep_Link handler SHALL navigate the app to the `/gig/:id` route.
3. WHEN the device receives a deep link matching the pattern `https://pahoy.app/contracts/:id`, THE Deep_Link handler SHALL navigate the app to the `/contracts/:id` route.
4. WHEN the device receives a deep link matching the pattern `https://pahoy.app/messages/:roomId`, THE Deep_Link handler SHALL navigate the app to the `/messages/:roomId` route.
5. THE Build_Pipeline SHALL configure Android App Links intent filters in `AndroidManifest.xml` for the supported deep link patterns.
6. IF the app is not authenticated when a deep link is received, THEN THE Deep_Link handler SHALL redirect the user to the login screen and navigate to the target route after successful authentication.

### Requirement 8: Status Bar and Navigation Bar Styling

**User Story:** As a user, I want the system bars to match the app's white theme, so that the UI feels seamless and integrated.

#### Acceptance Criteria

1. THE Build_Pipeline SHALL include the `@capacitor/status-bar` plugin as a project dependency.
2. WHEN the app launches, THE Status_Bar SHALL display with a white background and dark (black) icons and text.
3. WHEN the app launches, THE Navigation_Bar SHALL display with a white background and dark (black) system button icons.
4. THE Status_Bar styling SHALL be applied programmatically on app initialization using the Capacitor StatusBar plugin API.
5. WHILE the app is in the foreground, THE Status_Bar style SHALL remain consistent (light background, dark content) across all route transitions.

### Requirement 9: Build Pipeline Integration

**User Story:** As a developer, I want a streamlined build workflow, so that producing updated Android builds is fast and predictable.

#### Acceptance Criteria

1. THE Build_Pipeline SHALL add the following npm scripts to `package.json`: `cap:sync` (runs `npx cap sync`), `cap:open` (runs `npx cap open android`), and `cap:build` (runs the full build + sync + APK assembly sequence).
2. WHEN `npm run build` completes, THE Build_Pipeline SHALL output production-ready web assets to the `dist/` directory compatible with Capacitor's `webDir` configuration.
3. THE Build_Pipeline SHALL ensure that the Vite `base` configuration is set to `"./"` (relative paths) so that assets load correctly from the Android WebView's local file server.
4. THE Build_Pipeline SHALL add the `android/` directory to `.gitignore` to avoid committing generated native project files, OR document the rationale for committing it.
