# Design Document: Profile View

## Architecture Overview

The Profile View feature adds two new pages (`/profile` and `/profile/change-password`) and integrates them into the existing authenticated route structure. The architecture follows the established patterns: page-level components in `src/pages/`, reusing existing base components (`Input`, `Button`), the `api()`/`apiMultipart()` utilities for backend communication, and the `BottomNavigation` for persistent navigation.

### Component Hierarchy

```
AnimatedRoutes (src/main.tsx)
├── /profile → RequireAuth > RequireOnboarding > PageTransition > Profile
│   └── BottomNavigation (already mounted by AnimatedRoutes when path starts with /profile)
└── /profile/change-password → RequireAuth > PageTransition > ChangePassword
```

---

## Components

### 1. Profile Page (`src/pages/profile.tsx`)

The main profile page fetches user and profile data on mount, displays read-only account info, editable profile fields, a profile picture upload, and action buttons for password change and logout.

**State Model:**

```typescript
interface ProfilePageState {
  // Data
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  bio: string;
  phoneNumber: string;
  profilePicUrl: string | null;

  // UI state
  isLoading: boolean;
  fetchError: string | null;
  isSubmitting: boolean;
  isUploadingPic: boolean;
  showSuccess: boolean;
  showLogoutDialog: boolean;

  // Validation errors (field-level)
  errors: {
    first_name?: string;
    last_name?: string;
    bio?: string;
    phone_number?: string;
  };
}
```

**Data Fetching:**

On mount, the component makes two parallel requests:
- `GET /api/auth/user/` → retrieves `username`, `email`
- `GET /api/profile/retrieve/` → retrieves `first_name`, `last_name`, `bio`, `phone_number`, `profile_pic`

Both resolve before the loading state clears. If either fails, an error message is shown.

**Profile Update Flow:**

1. User modifies fields and taps "Guardar cambios"
2. Client-side validation: `first_name` and `last_name` must be non-empty
3. On valid → `PATCH /api/profile/update/` with JSON body containing only text fields
4. On success → brief success toast/indicator
5. On ApiError → map `fieldErrors` to component `errors` state

**Profile Picture Update Flow:**

1. User taps the profile picture area → hidden `<input type="file">` is triggered
2. User selects an image → `PATCH /api/profile/update/` via `apiMultipart()` with `profile_pic` as binary
3. On success → update `profilePicUrl` from the response
4. On failure → show error message

**Logout Flow:**

1. User taps "Cerrar sesión" → `showLogoutDialog = true`
2. Confirmation dialog appears using the existing `Modal`/`Dialog` components
3. User confirms → `POST /api/auth/logout/` then `clearToken()` then `navigate("/")`
4. User dismisses → `showLogoutDialog = false`

### 2. Change Password Page (`src/pages/change-password.tsx`)

A focused sub-page for password change, following the standard page layout pattern (sticky header with back button, logo, motion animation).

**State Model:**

```typescript
interface ChangePasswordState {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  isSubmitting: boolean;
  errors: {
    current_password?: string;
    new_password?: string;
    new_password_confirm?: string;
  };
}
```

**Validation Rules (client-side, on submit):**

1. All three fields must be non-empty
2. `newPassword` must be at least 8 characters
3. `newPassword` must equal `confirmPassword`

**Submit Flow:**

1. Validate client-side → if invalid, show errors, do NOT call API
2. `POST /api/auth/change-password/` with `{ current_password, new_password, new_password_confirm }`
3. On success → show brief success feedback → `navigate("/profile")`
4. On ApiError → map `fieldErrors` to `errors` state

---

## Interfaces & Data Models

### API Response Types

```typescript
// GET /api/auth/user/
interface UserData {
  username: string;
  email: string;
}

// GET /api/profile/retrieve/
interface ProfileData {
  first_name: string;
  last_name: string;
  bio: string;
  phone_number: string;
  profile_pic: string | null;
  onboarding_complete: boolean;
}

// PATCH /api/profile/update/ response (same shape as ProfileData)
type ProfileUpdateResponse = ProfileData;

// POST /api/auth/change-password/ success response
interface ChangePasswordResponse {
  detail: string;
}
```

### Form Error Mapping

Backend DRF errors (`Record<string, string[]>`) are mapped 1:1 to form field error state. Only the first error message per field is displayed (consistent with signup.tsx pattern).

---

## Routing Changes

Add to `src/main.tsx`:

```typescript
import { Profile } from "@/pages/profile";
import { ChangePassword } from "@/pages/change-password";

// Inside AnimatedRoutes Routes:
<Route path="/profile" element={
  <RequireAuth><RequireOnboarding><PageTransition><Profile /></PageTransition></RequireOnboarding></RequireAuth>
} />
<Route path="/profile/change-password" element={
  <RequireAuth><PageTransition><ChangePassword /></PageTransition></RequireAuth>
} />
```

The `/profile` route uses `RequireOnboarding` to ensure the user has completed onboarding. The `/profile/change-password` route only requires auth since the user is already through the profile page.

---

## UI Layout

### Profile Page Layout

```
┌─────────────────────────┐
│ Header: Logo centered   │
├─────────────────────────┤
│ Profile Picture (tap)   │
│ Username (read-only)    │
│ Email (read-only)       │
│ ─────────────────────── │
│ First Name [input]      │
│ Last Name [input]       │
│ Phone [input]           │
│ Bio [input]             │
│ ─────────────────────── │
│ [Guardar cambios] btn   │
│ [Cambiar contraseña]    │
│ [Cerrar sesión]         │
├─────────────────────────┤
│ Bottom Navigation       │
└─────────────────────────┘
```

### Change Password Page Layout

```
┌─────────────────────────┐
│ [←] Logo       [spacer] │
├─────────────────────────┤
│ Title: Cambiar contraseña│
│ Subtitle text           │
│ ─────────────────────── │
│ Current password [input]│
│ New password [input]    │
│ Confirm password [input]│
│                         │
│         flex-1          │
│                         │
│ [Cambiar contraseña] btn│
└─────────────────────────┘
```

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| Profile data fetch fails | Show centered error message with retry suggestion |
| Profile update API error (field-level) | Map to field `hint` props with `isInvalid` |
| Profile update API error (network) | Show general error toast/message |
| Image upload fails | Show error text near profile picture area |
| Password change API error (field-level) | Map to field `hint` props with `isInvalid` |
| Logout API fails | Still clear token and redirect (logout is best-effort) |

---

## Confirmation Dialog

The logout confirmation uses the existing `Modal`/`ModalOverlay`/`Dialog` components from `@/components/application/modals/modal`:

```typescript
<DialogTrigger>
  {/* Trigger is the "Cerrar sesión" button */}
  <ModalOverlay>
    <Modal>
      <Dialog>
        {/* Centered card with warning icon, title, description, and two buttons */}
      </Dialog>
    </Modal>
  </ModalOverlay>
</DialogTrigger>
```

The dialog follows React Aria's controlled dialog pattern via `isOpen`/`onOpenChange` for programmatic control during the logout flow.

---

## Animation

Both pages use the standard motion animation pattern:

```typescript
<motion.div
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.35, ease: "easeOut" }}
>
```

Additionally wrapped in `PageTransition` for route-level AnimatePresence transitions.

---

## Bottom Navigation Integration

The `NAV_ROUTES` array in `main.tsx` already includes `"/profile"`, so the `BottomNavigation` component renders automatically when `location.pathname.startsWith("/profile")`. The `/profile/change-password` path also starts with `/profile`, meaning the bottom nav would show there too. Since the change password page is a focused sub-page, the bottom nav visibility is acceptable (it's hidden by the page content structure and doesn't conflict).

However, if the design requires hiding it on the sub-page, the `NAV_ROUTES` check can be made exact-match only for `/profile`. Given the existing pattern (all NAV_ROUTES use `startsWith`), we'll keep the default behavior.

---

## Dependencies

No new libraries required. All functionality is achievable with:
- Existing `Input`, `Button` components
- Existing `Modal`/`ModalOverlay`/`Dialog` components
- `api()`, `apiMultipart()`, `ApiError` from `@/utils/api`
- `getToken`, `clearToken` from `@/utils/auth`
- `motion` from `motion/react`
- `useNavigate` from `react-router`
- Icons from `@untitledui/icons`

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Profile name fields require non-empty values

*For any* input strings provided as `first_name` and `last_name`, the profile form validation SHALL reject submission if and only if either string is empty or contains only whitespace characters. The error state SHALL reflect which specific field(s) are invalid.

**Validates: Requirements 2.2**

### Property 2: Password form validation is comprehensive

*For any* combination of `current_password`, `new_password`, and `new_password_confirm` values, the change password form SHALL accept submission if and only if all three fields are non-empty, `new_password` has at least 8 characters, and `new_password` equals `new_password_confirm`. When rejected, the error SHALL be displayed on the specific field that fails validation.

**Validates: Requirements 4.3, 4.4, 4.5**

### Property 3: Backend field errors map correctly to form fields

*For any* API error response containing a subset of known field keys with error messages, the form SHALL display each error message on its corresponding input field's hint, and no error SHALL appear on a field that was not in the API error response.

**Validates: Requirements 2.4, 4.8**

### Property 4: Typing in a field clears only that field's error

*For any* form state where one or more fields have displayed errors, when the user types in a specific field, only that field's error SHALL be cleared while all other field errors remain unchanged.

**Validates: Requirements 2.6, 4.10**
