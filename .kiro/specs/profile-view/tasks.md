# Implementation Plan: Profile View

## Overview

Implement the Profile View feature consisting of two new pages (`/profile` and `/profile/change-password`), integrated into the existing authenticated route structure. The profile page displays user data, allows editing profile fields and profile picture, and provides logout functionality. The change password page is a focused sub-page for password updates.

## Tasks

- [x] 1. Add routes and page stubs
  - [x] 1.1 Create the Profile page stub at `src/pages/profile.tsx`
    - Export a `Profile` component with placeholder content
    - Include the motion.div wrapper with standard animation (opacity 0→1, y 16→0)
    - _Requirements: 6.2_

  - [x] 1.2 Create the Change Password page stub at `src/pages/change-password.tsx`
    - Export a `ChangePassword` component with placeholder content
    - Include the standard page header (back button, centered logo, spacer) and motion animation
    - _Requirements: 6.3, 6.4_

  - [x] 1.3 Register both routes in `src/main.tsx`
    - Add `/profile` route wrapped with `RequireAuth > RequireOnboarding > PageTransition > Profile`
    - Add `/profile/change-password` route wrapped with `RequireAuth > PageTransition > ChangePassword`
    - Add necessary imports for `Profile` and `ChangePassword`
    - _Requirements: 6.5, 6.6_

- [x] 2. Implement Profile Page data display and layout
  - [x] 2.1 Implement data fetching on mount
    - Fetch `GET /api/auth/user/` and `GET /api/profile/retrieve/` in parallel on mount
    - Store `username`, `email`, `firstName`, `lastName`, `bio`, `phoneNumber`, `profilePicUrl` in state
    - Show a loading indicator while fetching; show error message on failure
    - _Requirements: 1.1, 1.5, 1.6_

  - [x] 2.2 Build the Profile Page UI layout
    - Display profile picture (or default avatar placeholder) at the top
    - Display username and email as read-only text (not inputs)
    - Render editable `Input` fields for first_name, last_name, phone_number, and bio pre-filled with fetched data
    - Add "Guardar cambios" primary button, "Cambiar contraseña" button, and "Cerrar sesión" button
    - Ensure `BottomNavigation` shows with profile tab active (already handled by route prefix)
    - _Requirements: 1.2, 1.3, 1.4, 6.1_

- [x] 3. Implement Profile form submission and validation
  - [x] 3.1 Implement client-side validation and form submit
    - Validate `first_name` and `last_name` are non-empty on submit
    - On valid, send `PATCH /api/profile/update/` with `{ first_name, last_name, bio, phone_number }` via `api()`
    - Show loading state on submit button while request is in progress
    - On success, display a brief success indication
    - On `ApiError`, map `fieldErrors` to corresponding field hints with `isInvalid`
    - Clear individual field errors when user starts typing in that field
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 4. Implement Profile Picture upload
  - [x] 4.1 Add profile picture tap-to-upload functionality
    - Add a hidden `<input type="file" accept="image/*">` triggered by tapping the profile picture area
    - On file selection, send `PATCH /api/profile/update/` via `apiMultipart()` with `profile_pic` field
    - Show a loading overlay on the picture area while uploading
    - On success, update the displayed profile picture URL from the response
    - On failure, display an error message near the picture area
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5. Implement Logout with confirmation dialog
  - [x] 5.1 Add logout confirmation dialog and flow
    - Add a "Cerrar sesión" button that opens a confirmation dialog using existing `Modal`/`ModalOverlay`/`Dialog` components
    - On confirm: call `POST /api/auth/logout/`, then `clearToken()`, then `navigate("/")`
    - On dismiss: close the dialog without further action
    - Ensure token is cleared even if the logout API call fails
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 6. Checkpoint
  - Ensure all profile page functionality works end-to-end, ask the user if questions arise.

- [x] 7. Implement Change Password page
  - [x] 7.1 Build the Change Password form UI
    - Render three password `Input` fields: current_password, new_password, new_password_confirm
    - Include the standard page header with back button navigating to `/profile`
    - Add title "Cambiar contraseña" and subtitle text
    - Pin "Cambiar contraseña" submit button at the bottom using flex spacer pattern
    - _Requirements: 4.1, 4.2, 6.3, 6.4_

  - [x] 7.2 Implement change password validation and submission
    - Validate all three fields non-empty, new_password ≥ 8 chars, new_password === new_password_confirm
    - If client-side validation fails, show errors on specific fields without calling API
    - On valid, send `POST /api/auth/change-password/` with `{ current_password, new_password, new_password_confirm }`
    - Show loading state on button while request is in progress
    - On success, show success message and navigate to `/profile`
    - On `ApiError`, map `fieldErrors` to corresponding field hints
    - Clear individual field errors when user types in that field
    - _Requirements: 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10_

- [x] 8. Final checkpoint
  - Ensure both pages work correctly, ask the user if questions arise.

- [ ]* 9. Write property-based tests
  - [ ]* 9.1 Write property test for profile name validation
    - **Property 1: Profile name fields require non-empty values**
    - **Validates: Requirements 2.2**

  - [ ]* 9.2 Write property test for password form validation
    - **Property 2: Password form validation is comprehensive**
    - **Validates: Requirements 4.3, 4.4, 4.5**

  - [ ]* 9.3 Write property test for backend error mapping
    - **Property 3: Backend field errors map correctly to form fields**
    - **Validates: Requirements 2.4, 4.8**

  - [ ]* 9.4 Write property test for field error clearing
    - **Property 4: Typing in a field clears only that field's error**
    - **Validates: Requirements 2.6, 4.10**

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- The Profile page reuses existing `Input`, `Button`, `Modal`/`Dialog` components
- API calls use the existing `api()`, `apiMultipart()`, and `ApiError` utilities from `@/utils/api`
- Auth utilities (`getToken`, `clearToken`) from `@/utils/auth` handle token management
- No new dependencies are required for this feature

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3"] },
    { "id": 2, "tasks": ["2.1", "7.1"] },
    { "id": 3, "tasks": ["2.2", "7.2"] },
    { "id": 4, "tasks": ["3.1", "4.1", "5.1"] },
    { "id": 5, "tasks": ["9.1", "9.2", "9.3", "9.4"] }
  ]
}
```
