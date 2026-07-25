# Implementation Plan: Complete Profile Onboarding

## Overview

Implement a mandatory onboarding flow that redirects users with `onboarding_complete === false` to a `/complete-profile` form page. The feature includes an `apiMultipart()` utility, a canvas-based image cropper component, the complete profile form page with all fields, a success screen, and a `RequireOnboarding` route guard integrated into existing routes.

## Tasks

- [x] 1. Add `apiMultipart()` helper to the API utility
  - [x] 1.1 Implement `apiMultipart()` function in `src/utils/api.ts`
    - Add the exported `apiMultipart<T>()` function that sends `multipart/form-data` requests
    - Do NOT set `Content-Type` header (browser adds boundary automatically)
    - Include `Authorization: Token` header from stored token
    - Handle 204 No Content, JSON parsing, error extraction matching existing `api()` patterns
    - Handle 401 token expiry (clear token, redirect to `/`)
    - Throw `ApiError` with field errors on non-2xx responses
    - _Requirements: 5.1_

- [x] 2. Create Image Cropper component
  - [x] 2.1 Create `src/components/application/image-cropper/image-cropper.tsx`
    - Implement modal overlay with canvas-based 1:1 square crop tool (no external library)
    - Props: `imageSrc: string`, `outputSize?: number` (default 400), `onCropComplete: (blob: Blob) => void`, `onCancel: () => void`
    - Display source image with a draggable/resizable square selection area (aspect ratio locked 1:1)
    - On confirm: draw selected region into offscreen 400x400 canvas, call `canvas.toBlob()` with `image/jpeg` quality 0.9
    - On cancel: call `onCancel` without changes
    - Modal styling: `fixed inset-0 z-50 bg-black/60`, content card `bg-white rounded-2xl max-w-sm w-full mx-4`
    - Buttons: "Recortar" (confirm) and "Cancelar" in a `grid grid-cols-2 gap-3 p-4 border-t` footer
    - Use `motion` for modal entry/exit animations
    - _Requirements: 2.2, 2.3, 2.4_

  - [ ]* 2.2 Write property test for image cropper output dimensions
    - **Property 1: Crop output dimensions are always 400x400**
    - **Validates: Requirements 2.3**

- [x] 3. Implement Complete Profile page layout and form fields
  - [x] 3.1 Create `src/pages/complete-profile.tsx` with page layout and header
    - Follow `signup.tsx` patterns: `min-h-dvh flex flex-col bg-white`
    - Header with brand logo centered, NO back button (onboarding cannot be skipped), right spacer
    - `motion.div` content area with fade-in animation (opacity 0→1, y 16→0, duration 0.35s)
    - Title: "Completa tu perfil" centered, subtitle below
    - On mount: fetch profile via `api()`, if `onboarding_complete === true` redirect to `/home`
    - _Requirements: 1.2, 3.1_

  - [x] 3.2 Implement profile picture upload with cropper integration
    - Circular avatar preview area, tap to open file picker (accept: image/jpeg, image/png, image/webp)
    - On file select: create object URL, open ImageCropper modal
    - On crop complete: store blob for submission, show cropped preview
    - On crop cancel: discard and close modal
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.3 Implement form fields (name, birth date, document ID, phone, bio)
    - First name and last name: `<Input>` with labels "Nombre" and "Apellido", required
    - Birth date: native `<input type="date">` styled to match design, required
    - Document ID: composite input with `<select>` for type (CV, CE, PASS, OTHER) + text input for number, required
    - Phone: `<Input>` with `type="tel"`, optional
    - Bio: `<Input>` or textarea with label "Sobre ti", optional
    - Use controlled state for all fields, clear errors on field change
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 3.4 Implement location detection button
    - "Detectar ubicación" button with `MarkerPin01` icon
    - On click: request browser geolocation (`enableHighAccuracy`, timeout 10s)
    - On success: PATCH `/api/auth/update-location/` with lat/lng, show `CheckCircle` success indicator
    - On failure: show error message "No pudimos detectar tu ubicación", allow continue
    - Loading state with spinner while detecting
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 4. Implement form validation, submission, and success screen
  - [x] 4.1 Implement client-side validation
    - Validate on submit (not on blur): first_name, last_name, birth_date, document_id required
    - Display inline errors via `hint` prop with `isInvalid={true}`
    - Clear individual field errors when user types in that field
    - _Requirements: 3.3_

  - [x] 4.2 Implement form submission with `apiMultipart()`
    - Build `FormData` with all fields, format document_id as `[TYPE]-[NUMBER]`
    - Append `profile_pic` blob as "profile.jpg" if present
    - Always append `onboarding_complete: "true"`
    - Call `apiMultipart<Profile>("/api/profile/update/", { method: "PATCH", body: formData })`
    - Map DRF field errors to form error state on ApiError catch
    - Disable submit button and show loading state while submitting
    - _Requirements: 5.1, 5.3, 5.4_

  - [x] 4.3 Implement success screen with auto-redirect
    - Full-screen white overlay with `motion` fade-in (opacity 0→1)
    - `CheckCircle` icon with spring scale animation (scale 0→1, delay 0.1)
    - Title: "¡Perfil completado!", subtitle: "Te estamos llevando a tu comunidad..."
    - Auto-redirect to `/home` after 2 seconds via `setTimeout`
    - _Requirements: 5.2_

  - [ ]* 4.4 Write property test for required field validation
    - **Property 2: Empty required fields produce exactly matching validation errors**
    - **Validates: Requirements 3.3**

  - [ ]* 4.5 Write property test for form submission onboarding flag
    - **Property 4: Form submission always includes onboarding_complete flag**
    - **Validates: Requirements 5.1**

  - [ ]* 4.6 Write property test for API error mapping
    - **Property 5: API field errors map correctly to form fields**
    - **Validates: Requirements 5.3**

- [ ]* 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Add RequireOnboarding route guard and wire routes
  - [x] 6.1 Implement `RequireOnboarding` component in `src/main.tsx`
    - Fetches `/api/profile/retrieve/` on mount
    - If `onboarding_complete === false` → `<Navigate to="/complete-profile" replace />`
    - If fetch fails → allow through (auth guard handles 401)
    - Show nothing (or loading) while checking
    - _Requirements: 1.1_

  - [x] 6.2 Update route configuration in `src/main.tsx`
    - Wrap `/home`, `/search`, `/gig/:id` routes with `<RequireOnboarding>` inside `<RequireAuth>`
    - Add `/complete-profile` route wrapped only with `<RequireAuth>` (no onboarding guard)
    - Import `CompleteProfile` page component
    - _Requirements: 1.1, 1.2, 1.3_

- [ ]* 7. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Visual Validate
  - Using Playwright MCP validate original mockups with actual implementation
  - Ask user is fixes are needed

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- The image cropper uses no external library — pure canvas-based implementation
- Document ID format sent to API: `[CV|CE|PASS|OTHER]-[NUMBER]`
- The header on complete-profile has NO back button (onboarding is mandatory)
- All animations use `motion` (Framer Motion) following existing patterns in signup.tsx

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1"] },
    { "id": 1, "tasks": ["2.2", "3.1"] },
    { "id": 2, "tasks": ["3.2", "3.3", "3.4"] },
    { "id": 3, "tasks": ["4.1", "4.2", "4.3"] },
    { "id": 4, "tasks": ["4.4", "4.5", "4.6"] },
    { "id": 5, "tasks": ["6.1"] },
    { "id": 6, "tasks": ["6.2"] }
  ]
}
```
