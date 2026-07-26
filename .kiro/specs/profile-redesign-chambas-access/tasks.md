# Implementation Plan: Profile Redesign & Chambas Access

## Overview

Restructure the profile page into a view-only display (with chambas summary and account settings) plus a separate edit page, add a change-email page, and update the bottom navigation to replace "Chambas" with "Mensajes". Implementation proceeds bottom-up: routes and navigation first, then new pages, then the profile view rewrite.

## Tasks

- [ ] 1. Update bottom navigation and route configuration
  - [ ] 1.1 Update bottom navigation items to replace "Chambas" with "Mensajes"
    - In `src/components/application/bottom-navigation/bottom-navigation.tsx`, replace the `Briefcase02` import with `MessageChatCircle` from `@untitledui/icons`
    - Change the "Chambas" nav item to `{ label: "Mensajes", path: "/messages", icon: MessageChatCircle }`
    - Verify the five items are: Inicio, Buscar, Contratos, Mensajes, Perfil
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ] 1.2 Update route configuration in `src/main.tsx`
    - Add imports for `ProfileEdit` and `ChangeEmail` page components
    - Update `NAV_ROUTES` to include `/messages` and keep `/gigs` for backward compat
    - Update `NO_NAV_ROUTES` to include `/profile/edit` and `/profile/change-email`
    - Add route entries for `/profile/edit` and `/profile/change-email` with `RequireAuth` + `RequireOnboarding` guards
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 2. Create the Profile Edit page
  - [ ] 2.1 Create `src/pages/profile-edit.tsx` with form and header
    - Extract and refactor the edit form logic from current `src/pages/profile.tsx`
    - Add sticky header with back button (navigates to `/profile`), centered brand logo, right spacer
    - Include form fields: first_name, last_name, phone_number, bio (pre-filled from API)
    - Include profile picture upload with camera overlay and ImageCropper integration
    - Include LocationSection component
    - Add "Guardar cambios" submit button with loading state
    - Implement client-side validation (first_name, last_name required)
    - Implement API field error mapping from Profile_Update_API
    - Clear individual field errors on typing
    - Show success message on successful save
    - Use motion.div page entry animation
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13, 3.14_

  - [ ]* 2.2 Write property tests for Profile Edit form validation
    - **Property 1: Profile edit form rejects empty required fields**
    - **Property 2: API field errors map to corresponding form fields**
    - **Property 3: Typing in an errored field clears only that field's error**
    - **Validates: Requirements 3.6, 3.7, 3.9, 3.11**

- [ ] 3. Create the Change Email page
  - [ ] 3.1 Create `src/pages/change-email.tsx`
    - Follow same layout pattern as `change-password.tsx`
    - Header with back button → `/profile`, centered brand logo, right spacer
    - Title: "Cambiar correo"
    - Email field with validation (non-empty, valid email format)
    - Submit sends `PATCH /api/auth/change-email/` with `{ email }`
    - Map API field errors to the email field
    - On success, navigate back to `/profile`
    - Loading state on submit button
    - Use motion.div page entry animation
    - _Requirements: 5.3, 7.2_

- [ ] 4. Rewrite the Profile View page
  - [ ] 4.1 Rewrite `src/pages/profile.tsx` as read-only profile view
    - Remove all form/edit logic from the existing file
    - Fetch User_Data_API and Profile_Data_API in parallel on mount
    - Display: profile picture (large centered circle), full name, @username, bio
    - Add loading state with centered spinner
    - Add error state: "No pudimos cargar tu perfil. Intenta de nuevo mas tarde."
    - Use `min-h-dvh flex flex-col bg-white pb-20` layout
    - Add motion.div entry animation
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_

  - [ ] 4.2 Add "Editar perfil" button to profile view
    - Render primary button below user info section that navigates to `/profile/edit`
    - Use `Button color="primary" size="xl" className="w-full"`
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 4.3 Implement Chambas Summary Section in profile view
    - Fetch My_Gigs_API separately (independent loading/error state)
    - Display heading "Mis Chambas (N)" with gig count
    - Show up to 3 compact preview cards (thumbnail, name, price)
    - Each card navigates to `/gig/{id}` on tap
    - Add "Ver todas" link navigating to `/gigs`
    - Empty state: "Aun no tienes chambas" with "Crear chamba" button → `/gigs/new`
    - Loading state: compact spinner
    - Error state: "No pudimos cargar tus chambas" + "Reintentar" button
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [ ]* 4.4 Write property tests for Chambas Summary Section
    - **Property 4: Gigs count display matches actual gig array length**
    - **Property 5: Gig preview display is capped at 3 items**
    - **Validates: Requirements 4.2, 4.3**

  - [ ] 4.5 Implement Account Settings Section in profile view
    - Render list of tappable items: "Cambiar correo", "Cambiar contraseña", "Cerrar sesión", "Eliminar cuenta"
    - Each item shows a chevron icon on the right
    - "Cambiar correo" navigates to `/profile/change-email`
    - "Cambiar contraseña" navigates to `/profile/change-password`
    - "Cerrar sesión" opens logout confirmation dialog (reuse existing dialog pattern)
    - "Eliminar cuenta" opens destructive confirmation dialog
    - Style "Eliminar cuenta" with `text-error-primary`
    - Implement logout: POST /api/auth/logout/ (best-effort), clearToken(), navigate("/")
    - Implement delete: DELETE /api/auth/delete-account/, on success clearToken() + navigate("/"), on failure show error message
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11, 5.12_

- [ ] 5. Ensure Chambas route backward compatibility
  - [ ] 5.1 Verify `/gigs` route still works with Bottom Navigation displayed
    - Confirm `/gigs` remains in NAV_ROUTES so the Bottom Navigation shows
    - Confirm no nav item is highlighted as active when on `/gigs` (since "Chambas" item was removed)
    - Ensure ChambasScreen still has RequireAuth and RequireOnboarding guards
    - _Requirements: 8.1, 8.2, 8.3_

- [ ] 6. Checkpoint - Ensure all pages build and integrate correctly
  - Ensure all tests pass, ask the user if questions arise.
  - Run `npm run build` to verify TypeScript compilation and no import errors
  - Perform visual validation with Playwright MCP against figma-screens

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The Profile Edit page (task 2.1) is largely extracted from the current `profile.tsx`, retaining most existing logic
- The change-email page (task 3.1) follows the same pattern as the existing `change-password.tsx`
- Property tests validate correctness properties from the design document
- The `/gigs` route stays registered and accessible — only the bottom nav entry changes

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["2.2", "4.1"] },
    { "id": 3, "tasks": ["4.2", "4.3"] },
    { "id": 4, "tasks": ["4.4", "4.5"] },
    { "id": 5, "tasks": ["5.1"] }
  ]
}
```
