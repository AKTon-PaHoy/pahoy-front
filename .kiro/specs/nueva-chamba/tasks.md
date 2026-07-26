# Implementation Plan: Nueva Chamba (Create New Gig)

## Overview

Implement the "Nueva Chamba" gig creation form at `/gigs/new`. The page follows the same structural patterns as `Signup` — a single-page component with local form state, client-side validation on submit, multipart API submission, and error mapping. The route is protected by `RequireAuth` + `RequireOnboarding` + `PageTransition` guards. Finally, the existing "Crear chamba" button in `ChambasScreen` is wired to navigate to this new route.

## Tasks

- [x] 1. Create the NuevaChambaScreen page component with route registration
  - [x] 1.1 Create `src/pages/nueva-chamba-screen.tsx` with the full page layout, header (back button + logo + spacer), motion.div content animation, form shell, and submit button
    - Use `min-h-dvh flex flex-col bg-white` layout
    - Header: back button with `ChevronLeft`, centered logo (`/splash-logo.png`), right spacer
    - Content area: `motion.div` with opacity 0→1 and y 16→0 over 0.35s ease-out
    - Title: "Nueva Chamba" with `text-display-xs font-bold text-primary`
    - Form container with `gap-5` spacing and flex-1 spacer before submit area
    - Submit button: `<Button type="submit" color="primary" size="xl" className="w-full">` with loading state text "Creando chamba..."
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.8, 5.3, 5.4, 5.6_

  - [x] 1.2 Register the `/gigs/new` route in `src/main.tsx` with RequireAuth, RequireOnboarding, and PageTransition wrappers
    - Add import for `NuevaChambaScreen`
    - Add `<Route path="/gigs/new" ...>` following the existing pattern used by `/gigs` and `/home`
    - _Requirements: 1.5, 7.1, 7.2_

- [x] 2. Implement form fields and local state management
  - [x] 2.1 Add all form fields with controlled state (name, description, price, priceType, isActive, tags) using `useState`
    - `<Input>` for "Nombre de la chamba" with maxLength 255, isRequired
    - `<Textarea>` for "Descripción", isRequired
    - `<Input>` for "Precio" with type number, isRequired
    - `<Input>` for "Tags" (optional)
    - Price type selector with "Fijo" (default) and "Horas" options using React Aria RadioGroup
    - Toggle for "Activa" defaulting to true using existing Toggle component
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.6, 2.7_

  - [x] 2.2 Implement the Image Upload Section with up to three image slots (front, second, third)
    - Each slot: placeholder when empty, opens file picker, validates dimensions (400–2000px), opens ImageCropper with 1:1 crop, stores blob, shows thumbnail preview
    - Tap filled slot to remove/replace
    - Display dimension error if image is outside valid range
    - _Requirements: 2.3, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Implement validation and submission logic
  - [x] 3.1 Implement `validateForm` function with client-side validation on submit only
    - Validate name is not empty → "El nombre es requerido"
    - Validate description is not empty → "La descripción es requerida"
    - Validate price > 0 → "El precio debe ser mayor a 0"
    - No validation on blur; errors only appear after submit
    - Clear individual field error on typing in that field
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 3.2 Implement `buildFormData` and `handleSubmit` with `apiMultipart()` call and navigation on success
    - Build FormData mapping: name, description, price, price_type, is_active, tags (optional), gig_front_img, gig_secong_img, gig_third_img
    - Call `apiMultipart("/api/gigs/create/", { method: "POST", body: formData })`
    - Navigate to `/gigs` on success
    - Map backend field errors to form error state (including non_field_errors → `_general`)
    - Display `_general` errors in a visible location within the form
    - _Requirements: 5.1, 5.2, 5.5, 6.1, 6.2, 6.3, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

  - [ ]* 3.3 Write property tests for validation, FormData construction, and error mapping
    - **Property 1: Client-side validation rejects invalid form states**
    - **Property 4: FormData construction round-trip**
    - **Property 5: Backend error mapping preserves field association**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 8.1–8.7, 6.1**

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure screens match to mockups using Playwright MCP, ask the user if questions arise.

- [ ] 5. Wire the ChambasScreen "Crear chamba" button and final visual validation
  - [x] 5.1 Update the "Crear chamba" button in `src/pages/chambas-screen.tsx` to navigate to `/gigs/new` instead of being disabled
    - Remove `disabled` prop and `opacity-50 cursor-not-allowed` classes
    - Add `onClick={() => navigate("/gigs/new")}` handler
    - _Requirements: 1.1_

  - [~] 5.2 Perform final visual validation of the NuevaChambaScreen against the Figma screenshot using Playwright MCP
    - Navigate to `/gigs/new` in the browser
    - Compare rendered page against `figma-screens/chambas/Nueva Chamba - Todos los Estados.png`
    - Adjust styling/layout if deviations are found
    - _Requirements: 1.1, 1.2, 2.8_

- [x] 6. Update the Chambas gig list to use the Service Card visual language
  - [x] 6.1 Adapt `src/components/application/service-card/service-card.tsx` only as needed to support the Chambas card state without regressing existing ServiceCard consumers
    - Preserve the existing horizontal Service Card structure from `ServiceCard`: compact thumbnail, rounded bordered/shadowed container, title/provider metadata, price, and primary "Ver más" CTA
    - Add or preserve an optional active/inactive status treatment if required by the current Chambas behavior, keeping the status associated with the correct gig
    - Use `/home/magneto/hackathon/pahoy-front/figma-screens/Service Card.png` as the visual source of truth for dimensions, spacing, typography, borders, radius, and CTA placement
    - _Requirements: 1.1 (Chambas entry point); user-requested Service Card visual update_

  - [x] 6.2 Replace the local square `GigCard` rendering in `src/pages/chambas-screen.tsx` with the adapted `ServiceCard` (or a thin Chambas-specific wrapper around it)
    - Map each `Gig` to the card props: gig ID/navigation, name, front image, price/price type, and Chambas-specific provider/status metadata
    - Keep the existing `/gig/:id` navigation, active-tab filtering, loading/error/empty states, and "Nueva"/"Crear chamba" actions intact
    - Update the list container and card spacing responsively so the complete Chambas view remains coherent around the Service Card layout
    - _Requirements: 1.1 (access to gig creation from Chambas); user-requested gig-list redesign_

  - [x] 6.3 Visually validate the complete Chambas view against `figma-screens/Service Card.png` using Playwright MCP
    - Check the header, tabs, list layout, Service Card image/content/price/CTA treatment, status presentation, bottom spacing, and navigation affordances
    - Exercise representative `todas`, `activas`, and `inactivas` states, capture the rendered result, and correct JSX/Tailwind styling in `src/pages/chambas-screen.tsx` and `src/components/application/service-card/service-card.tsx` when deviations are found
    - _Requirements: 1.1; user-requested full Chambas visual validation_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- The project uses TypeScript + React 19 + Vite + Tailwind CSS 4
- Existing components to reuse: `<Input>`, `<Textarea>`, `<Button>`, `Toggle`, `ImageCropper`
- The `apiMultipart()` utility from `@/utils/api` handles multipart/form-data requests
- The design uses TypeScript directly (no pseudocode), so no language selection step is needed

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["3.3", "6.1"] },
    { "id": 1, "tasks": ["5.2", "6.2"] },
    { "id": 2, "tasks": ["6.3"] }
  ]
}
```
