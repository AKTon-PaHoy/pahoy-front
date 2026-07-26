# Design Document: Profile Redesign & Chambas Access

## Architecture Overview

This feature restructures the profile experience into two pages (view + edit), adds a chambas summary section to the profile view, introduces account settings actions with confirmation dialogs, and updates the bottom navigation to replace "Chambas" with "Mensajes."

### High-Level Component Architecture

```
┌─────────────────────────────────────┐
│  /profile (Profile View Page)       │
│  ┌─────────────────────────────┐    │
│  │ Profile Info Section        │    │
│  │ (avatar, name, @user, bio)  │    │
│  ├─────────────────────────────┤    │
│  │ "Editar perfil" Button      │    │
│  ├─────────────────────────────┤    │
│  │ Chambas Summary Section     │    │
│  │ (count, preview cards, link)│    │
│  ├─────────────────────────────┤    │
│  │ Account Settings Section    │    │
│  │ (list of tappable items)    │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │ Bottom Navigation           │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  /profile/edit (Profile Edit Page)  │
│  ┌─────────────────────────────┐    │
│  │ Header (back, logo, spacer) │    │
│  ├─────────────────────────────┤    │
│  │ Profile Picture + Camera    │    │
│  ├─────────────────────────────┤    │
│  │ Form Fields                 │    │
│  │ (name, last, phone, bio)    │    │
│  ├─────────────────────────────┤    │
│  │ Location Section            │    │
│  ├─────────────────────────────┤    │
│  │ Save Button                 │    │
│  └─────────────────────────────┘    │
│  (No Bottom Navigation)             │
└─────────────────────────────────────┘
```

## File Structure

```
src/pages/
├── profile.tsx              → Rewritten as read-only Profile View
├── profile-edit.tsx         → New file: edit form (moved from current profile.tsx)
└── change-email.tsx         → New file: email change form

src/components/application/
└── bottom-navigation/
    └── bottom-navigation.tsx → Updated nav items
    
src/main.tsx                  → Route config updates
```

## Component Design

### 1. Profile View Page (`src/pages/profile.tsx`)

The existing `profile.tsx` will be fully rewritten as a read-only display page.

**State Model:**

```typescript
interface ProfileViewState {
  // User data from APIs
  username: string;
  firstName: string;
  lastName: string;
  bio: string;
  profilePicUrl: string | null;
  location: string | null;

  // Gigs data
  gigs: GigPreview[];
  gigsLoading: boolean;
  gigsError: string | null;

  // Page loading
  isLoading: boolean;
  fetchError: string | null;

  // Dialog states
  showLogoutDialog: boolean;
  showDeleteDialog: boolean;
  isLoggingOut: boolean;
  isDeleting: boolean;
  deleteError: string | null;
}

interface GigPreview {
  id: number;
  name: string;
  front_image: string | null;
  price: string;
}
```

**Data Fetching Strategy:**

On mount, the page fetches three endpoints in parallel:
1. `GET /api/auth/user/` → username, email, location
2. `GET /api/profile/retrieve/` → first_name, last_name, bio, phone_number, profile_pic
3. `GET /api/gigs/my-gigs/` → array of gigs (separate loading state)

Profile data (1+2) shares a single loading/error state. Gigs (3) has its own loading/error state so partial data can render.

**Section Layout:**

```tsx
<motion.div className="flex min-h-dvh flex-col bg-white pb-20">
  {/* Profile Info */}
  <div className="flex flex-col items-center px-4 pt-8">
    {/* Avatar */}
    {/* Full name */}
    {/* @username */}
    {/* Bio */}
  </div>

  {/* Edit Profile Button */}
  <div className="px-4 mt-6">
    <Button color="primary" size="xl" className="w-full" onClick={→ /profile/edit}>
      Editar perfil
    </Button>
  </div>

  {/* Chambas Summary Section */}
  <section className="px-4 mt-8">
    {/* Heading with count */}
    {/* Gig preview cards or empty state */}
    {/* "Ver todas" link */}
  </section>

  {/* Account Settings Section */}
  <section className="px-4 mt-8">
    {/* Settings item list */}
  </section>
</motion.div>
```

### 2. Profile Edit Page (`src/pages/profile-edit.tsx`)

This page extracts the existing edit form logic from `profile.tsx`. It follows the same header pattern as `change-password.tsx`.

**Key differences from current profile.tsx:**
- Adds sticky header with back button → `/profile`
- Removes logout button (moved to profile view)
- Removes username/email display (not editable here)
- Keeps: picture upload + cropper, form fields, LocationSection, save button

**Header Pattern (matches change-password.tsx):**

```tsx
<header className="flex items-center justify-between px-4 pt-4 pb-2">
  <button onClick={() => navigate("/profile")} className="flex size-10 items-center justify-center rounded-lg text-neutral-500">
    <ChevronLeft className="size-6" />
  </button>
  <img src="/thunderface.png" alt="Pa·Hoy" className="h-8" />
  <div className="size-10" />
</header>
```

### 3. Chambas Summary Section (inline in Profile View)

**Rendering Logic:**

```
IF gigsLoading → show loading spinner
ELSE IF gigsError → show error message + "Reintentar" button
ELSE IF gigs.length === 0 → show empty state with "Crear chamba" button
ELSE → show heading with count, up to 3 preview cards, "Ver todas" link
```

**Preview Cards:** Use a simplified card layout (not full `ServiceCard`) showing:
- Small thumbnail image (front_image)
- Gig name
- Price
- Tap navigates to `/gig/{id}`

### 4. Account Settings Section (inline in Profile View)

**Item Structure:**

```typescript
interface SettingsItem {
  label: string;
  action: "navigate" | "dialog";
  path?: string;
  dialogType?: "logout" | "delete";
  destructive?: boolean;
}

const settingsItems: SettingsItem[] = [
  { label: "Cambiar correo", action: "navigate", path: "/profile/change-email" },
  { label: "Cambiar contraseña", action: "navigate", path: "/profile/change-password" },
  { label: "Cerrar sesión", action: "dialog", dialogType: "logout" },
  { label: "Eliminar cuenta", action: "dialog", dialogType: "delete", destructive: true },
];
```

**Rendering:** Each item renders as a tappable row with a chevron icon. The "Eliminar cuenta" item uses `text-error-primary` styling.

**Dialogs:** Reuse the existing `DialogTrigger` / `ModalOverlay` / `Modal` / `Dialog` pattern from the current profile.tsx logout dialog.

### 5. Change Email Page (`src/pages/change-email.tsx`)

Follows the same layout as `change-password.tsx`:
- Header with back button → `/profile`
- Title: "Cambiar correo"
- Fields: new_email (with email validation)
- Submit sends `PATCH /api/auth/change-email/` with `{ email }`
- On success, navigates back to `/profile`

### 6. Bottom Navigation Update

**Current navItems:**
```typescript
["Inicio", "Buscar", "Contratos", "Chambas", "Perfil"]
```

**New navItems:**
```typescript
import { MessageChatCircle } from "@untitledui/icons";

const navItems: NavItem[] = [
  { label: "Inicio", path: "/home", icon: Home02 },
  { label: "Buscar", path: "/search", icon: SearchLg },
  { label: "Contratos", path: "/contracts", icon: ClipboardCheck },
  { label: "Mensajes", path: "/messages", icon: MessageChatCircle },
  { label: "Perfil", path: "/profile", icon: User01 },
];
```

### 7. Route Configuration Updates (`src/main.tsx`)

```typescript
// Updated NAV_ROUTES — replace /gigs with /messages, keep /gigs for backward compat
const NAV_ROUTES = ["/home", "/search", "/contracts", "/messages", "/profile", "/gigs"];

// Add to NO_NAV_ROUTES (sub-pages without bottom nav)
const NO_NAV_ROUTES = ["/gigs/new", "/profile/edit", "/profile/change-email"];

// New route entries:
<Route path="/profile/edit" element={
  <RequireAuth><RequireOnboarding><PageTransition><ProfileEdit /></PageTransition></RequireOnboarding></RequireAuth>
} />
<Route path="/profile/change-email" element={
  <RequireAuth><RequireOnboarding><PageTransition><ChangeEmail /></PageTransition></RequireOnboarding></RequireAuth>
} />
```

## Data Flow

### Profile View Load Sequence

```
1. Component mounts
2. setIsLoading(true)
3. Promise.all([
     api("/api/auth/user/"),
     api("/api/profile/retrieve/"),
   ])
4. On success → populate user state, setIsLoading(false)
   On failure → setFetchError("No pudimos cargar tu perfil..."), setIsLoading(false)
5. Separately: api("/api/gigs/my-gigs/")
   On success → setGigs(data), setGigsLoading(false)
   On failure → setGigsError("No pudimos cargar tus chambas"), setGigsLoading(false)
```

### Logout Flow

```
1. User taps "Cerrar sesión"
2. Show confirmation dialog
3. User confirms → call POST /api/auth/logout/ (best-effort)
4. clearToken()
5. navigate("/")
```

### Delete Account Flow

```
1. User taps "Eliminar cuenta"
2. Show destructive confirmation dialog
3. User confirms → call DELETE /api/auth/delete-account/
4. On success → clearToken(), navigate("/")
5. On failure → show error message in dialog or toast
```

### Profile Edit Submit Flow

```
1. User fills form fields
2. Client-side validation: first_name and last_name must not be empty
3. On invalid → show field errors, do NOT call API
4. On valid → PATCH /api/profile/update/ with field data
5. On success → show success message
6. On API errors → map fieldErrors to form fields
7. On typing in errored field → clear that field's error
```

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Profile data fetch fails | Full-page error: "No pudimos cargar tu perfil. Intenta de nuevo mas tarde." |
| Gigs fetch fails | Section-level error: "No pudimos cargar tus chambas" + "Reintentar" button |
| Profile update validation | Field-level inline errors via `hint` + `isInvalid` |
| Profile update API error | Map `fieldErrors` to form fields |
| Logout API fails | Ignore (best-effort), still clear token and navigate |
| Delete account API fails | Show error: "No pudimos eliminar tu cuenta. Intenta de nuevo mas tarde." |
| Change email API error | Map field errors to email field |

## Interfaces & Types

```typescript
// API Response Types
interface UserData {
  username: string;
  email: string;
  location: string | { type: string; coordinates: [number, number] } | null;
}

interface ProfileData {
  first_name: string;
  last_name: string;
  bio: string;
  phone_number: string;
  profile_pic: string | null;
  onboarding_complete: boolean;
}

interface GigListItem {
  id: number;
  name: string;
  front_image: string | null;
  price: string;
  status: string;
}

// Component Props (if extracted)
interface ChambasSummarySectionProps {
  gigs: GigListItem[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

interface AccountSettingsItemProps {
  label: string;
  onClick: () => void;
  destructive?: boolean;
}
```

## Animation & Transitions

All pages use the standard motion pattern:

```typescript
<motion.div
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.35, ease: "easeOut" }}
>
```

## Accessibility Considerations

- All tappable settings items use `<button>` elements with descriptive labels
- Confirmation dialogs trap focus and are dismissible with Escape
- Profile picture upload button has `aria-label="Cambiar foto de perfil"`
- Loading states are announced to screen readers
- Destructive actions are visually distinguished with error color tokens

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Profile edit form rejects empty required fields

*For any* combination of first_name and last_name input values where either is empty or whitespace-only, submitting the profile edit form SHALL prevent the API call from being made and SHALL display a validation error on the empty field(s).

**Validates: Requirements 3.6, 3.7**

### Property 2: API field errors map to corresponding form fields

*For any* set of field-level validation errors returned by the Profile_Update_API (in DRF format `{ field: ["msg", ...] }`), each error SHALL be displayed as a hint on the matching form field, and no errors SHALL be lost or misattributed.

**Validates: Requirements 3.9**

### Property 3: Typing in an errored field clears only that field's error

*For any* form state where one or more fields have displayed validation errors, when the user types in a specific errored field, only that field's error SHALL be cleared while all other field errors remain unchanged.

**Validates: Requirements 3.11**

### Property 4: Gigs count display matches actual gig array length

*For any* array of gigs returned by My_Gigs_API, the Chambas_Summary_Section heading SHALL display a count equal to the total length of the gig array.

**Validates: Requirements 4.2**

### Property 5: Gig preview display is capped at 3 items

*For any* non-empty array of gigs of length N, the Chambas_Summary_Section SHALL display exactly `min(N, 3)` preview cards.

**Validates: Requirements 4.3**
