# Implementation Plan: Chambas (My Gigs) View

## Overview

Implement the Chambas view as a new page component at `/gigs` that displays the authenticated user's gigs with tab-based filtering, status badges, and appropriate loading/empty/error states. The implementation follows the same patterns as `HomeScreen` and uses the existing `api()` utility, `RequireAuth`, `RequireOnboarding` guards, and `PageTransition` wrapper.

## Tasks

- [x] 1. Create ChambasScreen page component with route registration
  - [ ] 1.1 Create `src/pages/chambas-screen.tsx` with base layout, types, and fetch logic
    - Define `Gig`, `PaginatedGigResponse`, and `TabFilter` interfaces
    - Implement `ChambasScreen` component with `min-h-dvh flex flex-col bg-white pb-20` layout
    - Add page header "Mis Chambas" with `text-display-xs font-bold text-primary`
    - Implement `fetchGigs` function using `api()` to call `/api/gigs/my-gigs/` with optional `is_active` param
    - Add `motion.div` animation wrapper (opacity 0→1, y 16→0, 0.35s ease-out)
    - Implement loading state with centered spinner (`size-8 animate-spin rounded-full border-4 border-neutral-200 border-t-brand-600`)
    - Implement error state with "No pudimos cargar tus chambas" message and "Reintentar" button
    - Handle 401 errors silently (already handled by `api()` utility)
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 6.1, 6.2_

  - [ ] 1.2 Register the `/gigs` route in `src/main.tsx`
    - Import `ChambasScreen` from `@/pages/chambas-screen`
    - Add `<Route path="/gigs">` wrapped with `RequireAuth`, `RequireOnboarding`, and `PageTransition`
    - _Requirements: 1.1, 1.4, 7.1, 7.2_

- [x] 2. Implement tab filtering and gig card display
  - [x] 2.1 Add TabFilter component inline within ChambasScreen
    - Render three tabs: "Todas" (default), "Activas", "Inactivas"
    - Apply `role="tablist"` on container and `role="tab"` with `aria-selected` on each button
    - Style active tab with `text-brand-600` and bottom border indicator; inactive tabs with `text-neutral-500`
    - On tab change: update state, call `fetchGigs` with appropriate filter parameter
    - Show loading state while filtered request is in progress
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 2.2 Implement GigCard with StatusBadge and price formatting
    - Render each gig as a card with: name, front image (or neutral placeholder), and formatted price
    - Add StatusBadge: "Activa" (`bg-success-50 text-success-700`) or "Inactiva" (`bg-neutral-100 text-neutral-600`)
    - Format price as "Desde $X" for "Fijo" or "$X/hr" for "Horas"
    - Navigate to `/gig/{gig_id}` on card tap using `useNavigate()`
    - Add `aria-label` on status badges for accessibility
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 2.3 Implement contextual empty states per tab
    - "Todas" tab: show icon, heading "Aún no tienes chambas", description "Crea tu primera chamba y empieza a recibir clientes", and a visually disabled "Crear chamba" primary button (reduced opacity)
    - "Activas" tab: show "No tienes chambas activas"
    - "Inactivas" tab: show "No tienes chambas inactivas"
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 3. Checkpoint
  - Ensure the app builds without errors (`npm run build`), ask the user if questions arise.

- [ ]* 4. Write property-based tests for GigCard logic
  - [ ]* 4.1 Write property test for status badge correctness
    - **Property 2: Status badge correctness**
    - For any gig object, verify badge text and styling matches `is_active` boolean
    - **Validates: Requirements 4.2**

  - [ ]* 4.2 Write property test for price formatting
    - **Property 4: Price formatting by type**
    - For any gig with price `p` and price_type `t`, verify output is "Desde $p" for "Fijo" or "$p/hr" for "Horas"
    - **Validates: Requirements 4.4**

- [x] 5. Final checkpoint
  - Ensure the mock ups provided match with actual app using playwright mcp, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The `/gigs` path is already in `NAV_ROUTES` so `BottomNavigation` will automatically show
- Authentication guard (Requirement 7) is handled by existing `RequireAuth` and `RequireOnboarding` wrappers
- 401 handling is built into the `api()` utility — no custom logic needed
- The design calls for custom `GigCard` rather than modifying the shared `ServiceCard` to keep the shared component stable
- Property tests validate universal correctness guarantees from the design document

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1", "2.2", "2.3"] },
    { "id": 2, "tasks": ["4.1", "4.2"] }
  ]
}
```
