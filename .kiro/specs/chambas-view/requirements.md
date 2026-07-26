# Requirements Document

## Introduction

The Chambas (My Gigs) view displays the authenticated user's own gigs at the `/gigs` route. It allows the talent to see all their published services, filter them by status (active/inactive), and provides appropriate feedback for loading, empty, and error states. The view reuses the existing ServiceCard component with the addition of a status badge indicating whether each gig is active or inactive.

## Glossary

- **Chambas_View**: The page component rendered at the `/gigs` route that displays the authenticated user's gigs
- **Gig_Card**: A visual card element based on the existing ServiceCard component that displays a single gig's information along with a status badge
- **Status_Badge**: A visual indicator displayed on each Gig_Card showing whether the gig is active ("Activa") or inactive ("Inactiva")
- **Tab_Filter**: A set of tab buttons at the top of the gig list allowing the user to filter gigs by status ("Todas", "Activas", "Inactivas")
- **My_Gigs_API**: The backend endpoint `GET /api/gigs/my-gigs/` that returns the authenticated user's gigs with optional `is_active` filter
- **Empty_State**: The UI state displayed when the user has no gigs matching the current filter
- **Loading_State**: The UI state displayed while the gig data is being fetched from the My_Gigs_API
- **Error_State**: The UI state displayed when the My_Gigs_API request fails

## Requirements

### Requirement 1: Page Layout and Route Registration

**User Story:** As a talent, I want to access my gigs view from the bottom navigation, so that I can manage my published services.

#### Acceptance Criteria

1. WHEN the user navigates to `/gigs`, THE Chambas_View SHALL render with a full-height mobile layout using `min-h-dvh flex flex-col bg-white` and bottom padding of `pb-20` to accommodate the bottom navigation.
2. THE Chambas_View SHALL display a page header with the title "Mis Chambas" styled as `text-display-xs font-bold text-primary`.
3. WHEN the Chambas_View mounts, THE Chambas_View SHALL animate the content area using motion.div with opacity transition from 0 to 1 and vertical translation from 16px to 0 over 0.35 seconds with ease-out easing.
4. THE Chambas_View SHALL display the BottomNavigation component with the "Chambas" tab highlighted as the active route.

### Requirement 2: Data Fetching

**User Story:** As a talent, I want my gigs to load automatically when I open the Chambas view, so that I can see my services without additional actions.

#### Acceptance Criteria

1. WHEN the Chambas_View mounts, THE Chambas_View SHALL send a GET request to the My_Gigs_API endpoint `/api/gigs/my-gigs/` with the authentication token from local storage.
2. WHILE the My_Gigs_API request is in progress, THE Chambas_View SHALL display the Loading_State with a centered spinner element using the pattern: `size-8 animate-spin rounded-full border-4 border-neutral-200 border-t-brand-600`.
3. WHEN the My_Gigs_API returns a successful response, THE Chambas_View SHALL store the results array and display the gigs as Gig_Card elements.
4. IF the My_Gigs_API request fails with a non-401 status, THEN THE Chambas_View SHALL display the Error_State with a user-friendly error message.

### Requirement 3: Tab-Based Filtering

**User Story:** As a talent, I want to filter my gigs by active or inactive status, so that I can quickly find the services I am looking for.

#### Acceptance Criteria

1. THE Chambas_View SHALL display a Tab_Filter with three options: "Todas" (default selected), "Activas", and "Inactivas" positioned below the page header and above the gig list.
2. WHEN the user selects the "Todas" tab, THE Chambas_View SHALL send a GET request to `/api/gigs/my-gigs/` without the `is_active` query parameter and display all returned gigs.
3. WHEN the user selects the "Activas" tab, THE Chambas_View SHALL send a GET request to `/api/gigs/my-gigs/?is_active=true` and display only active gigs.
4. WHEN the user selects the "Inactivas" tab, THE Chambas_View SHALL send a GET request to `/api/gigs/my-gigs/?is_active=false` and display only inactive gigs.
5. WHEN a tab is selected, THE Chambas_View SHALL display the Loading_State while the filtered request is in progress.
6. THE Tab_Filter SHALL visually distinguish the selected tab using brand-600 color for the active tab text and a bottom border indicator, with neutral-500 for inactive tabs.

### Requirement 4: Gig Card Display with Status Badge

**User Story:** As a talent, I want to see each gig's status clearly on its card, so that I know which services are currently active or inactive.

#### Acceptance Criteria

1. WHEN gigs are available, THE Chambas_View SHALL render each gig as a Gig_Card displaying: the gig name, the gig front image (or a neutral placeholder if no image exists), and the price with price_type indicator.
2. THE Gig_Card SHALL display a Status_Badge indicating "Activa" with a green background (`bg-success-50 text-success-700`) when `is_active` is true, or "Inactiva" with a neutral background (`bg-neutral-100 text-neutral-600`) when `is_active` is false.
3. WHEN the user taps a Gig_Card, THE Chambas_View SHALL navigate to `/gig/{gig_id}` where `{gig_id}` is the UUID of the selected gig.
4. THE Gig_Card SHALL display the price formatted as "Desde ${price}" for "Fijo" price_type or "${price}/hr" for "Horas" price_type.

### Requirement 5: Empty State

**User Story:** As a talent with no gigs, I want to see a helpful message explaining that I have no services yet, so that I understand the page is not broken.

#### Acceptance Criteria

1. WHEN the My_Gigs_API returns zero results for the "Todas" tab, THE Chambas_View SHALL display the Empty_State with an illustrative icon, a heading text "Aún no tienes chambas", and a descriptive message "Crea tu primera chamba y empieza a recibir clientes".
2. WHEN the My_Gigs_API returns zero results for the "Activas" or "Inactivas" tabs, THE Chambas_View SHALL display a contextual empty message: "No tienes chambas activas" or "No tienes chambas inactivas" respectively.
3. THE Empty_State for the "Todas" tab SHALL display a "Crear chamba" button styled as a primary button that is visually disabled (reduced opacity) since the gig creation flow is deferred.

### Requirement 6: Error State

**User Story:** As a talent, I want to see a clear error message when something goes wrong loading my gigs, so that I know there is an issue and can try again.

#### Acceptance Criteria

1. IF the My_Gigs_API request fails, THEN THE Chambas_View SHALL display an error message "No pudimos cargar tus chambas" with a "Reintentar" button.
2. WHEN the user taps the "Reintentar" button, THE Chambas_View SHALL re-send the GET request to the My_Gigs_API for the currently selected tab filter and display the Loading_State during the request.

### Requirement 7: Authentication Guard

**User Story:** As an unauthenticated user, I want to be redirected to the splash screen if I try to access the Chambas view, so that the app protects private data.

#### Acceptance Criteria

1. WHEN a user without a valid authentication token navigates to `/gigs`, THE Chambas_View SHALL redirect the user to the `/` route.
2. WHEN a user who has not completed onboarding navigates to `/gigs`, THE Chambas_View SHALL redirect the user to `/complete-profile`.
