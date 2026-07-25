# View & Form Styling Patterns

Reference implementation: `src/pages/signup.tsx`

## Page Layout

- Full-height mobile container: `min-h-dvh flex flex-col bg-white`
- Content area animates in with `motion.div` (`opacity: 0 → 1`, `y: 16 → 0`, duration 0.35s ease-out)
- Bottom actions pinned via flex spacer (`<div className="flex-1" />`) between form fields and submit area

## Header

- Sticky-style top bar: `flex items-center justify-between px-4 pt-4 pb-2`
- Back button: plain `<button>` with `size-10 rounded-lg text-neutral-500` containing `ChevronLeft` icon (size-6)
- Brand logo centered: `<img src="/splash-logo.png" className="h-8" />`
- Right spacer: `<div className="size-10" />` to balance the back button

## Typography

- Page title: `text-display-xs font-bold text-primary` centered
- Subtitle: `text-sm text-tertiary` centered, `mt-1` below title
- Field labels: handled by `<Input label="..." />` — renders `text-sm font-medium text-secondary`
- Hint text below fields: `text-sm text-tertiary` (default) or `text-error-primary` (invalid)

## Form Fields

- Use the `<Input>` component from `@/components/base/input/input`
- Spacing between fields: `gap-5` on the form container
- Field props pattern:
  - `label` — field label text
  - `placeholder` — placeholder text
  - `icon` — leading icon component (e.g., `Mail01`, `Lock01` from `@untitledui/icons`)
  - `type` — `"email"`, `"password"`, etc.
  - `isRequired` — shows the asterisk on the label
  - `isInvalid` — triggers red border + error styling
  - `hint` — descriptive text or error message below the field (ReactNode)
  - `value` / `onChange` — controlled input

## Validation & Error States

- Client-side validation runs on submit (not on blur)
- Each field error clears individually when the user starts typing in that field
- Error messages are shown via the `hint` prop with `isInvalid={true}`
- Backend (DRF) field errors are mapped 1:1 to form fields after API call
- Password field shows a success hint with green icon when valid:
  ```tsx
  <span className="flex items-center gap-1 text-success-primary">
      <CheckCircle className="size-3.5" />
      Debe tener al menos 8 caracteres
  </span>
  ```

## Buttons

- Primary CTA: `<Button type="submit" color="primary" size="xl" className="w-full">`
- Loading state: `isLoading={true} showTextWhileLoading` — shows spinner + updated text ("Creando tu cuenta...")
- Footer link pattern:
  ```tsx
  <p className="mt-4 text-center text-sm text-tertiary">
      ¿Ya tienes cuenta?{" "}
      <button type="button" className="font-semibold text-brand-600">
          Entra aquí
      </button>
  </p>
  ```

## API Integration Pattern

- Use `api()` from `@/utils/api` for all backend calls
- Wrap in try/catch, check `instanceof ApiError`
- Map `err.fieldErrors` (DRF format: `{ field: ["msg", ...] }`) to component error state
- Always call `setIsSubmitting(false)` in `finally` block
- On success navigate with `useNavigate()` from react-router

## Color Tokens Used

| Purpose | Token |
|---------|-------|
| Page background | `bg-white` |
| Primary text | `text-primary` (neutral-900) |
| Secondary text | `text-tertiary` (neutral-600) |
| Error text/border | `text-error-primary` / `ring-error` |
| Success indicator | `text-success-primary` (green-600) |
| Brand accent (links) | `text-brand-600` |
| Primary button | `bg-brand-solid` (brand-600) |
| Input border default | `ring-primary` (neutral-300) |
| Input border focus | `ring-brand` (brand-500) |
| Input border error | `ring-error_subtle` / `ring-error` on focus |
