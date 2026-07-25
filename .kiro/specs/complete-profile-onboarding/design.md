# Design: Complete Profile Onboarding

## Architecture Overview

The complete-profile onboarding feature adds a mandatory profile completion step after login/signup for users whose `onboarding_complete` flag is `false`. It introduces a new route (`/complete-profile`), a route guard component (`RequireOnboarding`), a page component with a multi-field form, an image cropper modal for the 400x400 profile picture, and a success screen with auto-redirect.

---

## Component Architecture & File Structure

```
src/
├── components/
│   └── application/
│       └── image-cropper/
│           └── image-cropper.tsx          # Modal with canvas-based 1:1 crop tool
├── pages/
│   └── complete-profile.tsx               # Onboarding form page
├── utils/
│   └── api.ts                             # Extended with apiMultipart() helper
└── main.tsx                               # Updated with RequireOnboarding guard
```

---

## Route Guard: `RequireOnboarding`

A wrapper component placed around authenticated routes that checks the user's profile `onboarding_complete` status and redirects accordingly.

### Logic Flow

```typescript
// src/main.tsx — new component added alongside RequireAuth

function RequireOnboarding({ children }: { children: React.ReactNode }) {
    const [checking, setChecking] = useState(true);
    const [needsOnboarding, setNeedsOnboarding] = useState(false);

    useEffect(() => {
        api<Profile>("/api/profile/retrieve/")
            .then((profile) => {
                setNeedsOnboarding(!profile.onboarding_complete);
            })
            .catch(() => {
                // If profile fetch fails, allow through (auth guard handles 401)
                setNeedsOnboarding(false);
            })
            .finally(() => setChecking(false));
    }, []);

    if (checking) return null; // or a loading spinner
    if (needsOnboarding) return <Navigate to="/complete-profile" replace />;
    return <>{children}</>;
}
```

### Integration in `main.tsx`

```typescript
// Wrap authenticated routes with RequireOnboarding (inside RequireAuth)
<Route path="/home" element={
    <RequireAuth>
        <RequireOnboarding>
            <PageTransition><HomeScreen /></PageTransition>
        </RequireOnboarding>
    </RequireAuth>
} />

// Add the /complete-profile route (only requires auth, not onboarding)
<Route path="/complete-profile" element={
    <RequireAuth>
        <PageTransition><CompleteProfile /></PageTransition>
    </RequireAuth>
} />
```

The `SplashGuard` remains unchanged — after login sets the token, navigation to `/home` triggers `RequireOnboarding` which checks the profile and redirects to `/complete-profile` if needed.

### Redirect logic for already-onboarded users

Inside `CompleteProfile` page component, on mount:
```typescript
useEffect(() => {
    api<Profile>("/api/profile/retrieve/").then((profile) => {
        if (profile.onboarding_complete) {
            navigate("/home", { replace: true });
        }
    });
}, []);
```

---

## Page Component: `src/pages/complete-profile.tsx`

### Layout Structure

Follows the same pattern as `signup.tsx`:
- `min-h-dvh flex flex-col bg-white`
- Sticky header with back button, brand logo, spacer
- `motion.div` content area with fade-in animation
- Scrollable form with fields, spacer, and pinned submit area

### Form Fields

| Field | Component | Props | Required |
|-------|-----------|-------|----------|
| Profile picture | Custom avatar + file input | Circular preview, tap to select | No |
| Nombre | `<Input>` | `label="Nombre" placeholder="Ej: Ramón"` | Yes |
| Apellido | `<Input>` | `label="Apellido" placeholder="Ej: Pérez"` | Yes |
| Fecha de nacimiento | `<DatePicker>` (adapted) | Inline button trigger, formatted display | Yes |
| Documento de identidad | Composite (Select + Input) | Type dropdown + number input | Yes |
| Teléfono | `<Input>` | `label="Teléfono" type="tel" placeholder="+57..."` | No |
| Bio | `<Input>` (or textarea) | `label="Sobre ti" placeholder="Cuéntanos..."` | No |
| Ubicación | Button with icon | "Detectar ubicación" with GPS icon | No |

### Form State Interface

```typescript
interface ProfileFormState {
    firstName: string;
    lastName: string;
    birthDate: string | null; // YYYY-MM-DD
    documentType: "CC" | "TI" | "CE" | "PP";
    documentNumber: string;
    phoneNumber: string;
    bio: string;
    profilePicBlob: Blob | null;
    profilePicPreview: string | null; // object URL for preview
    locationDetected: boolean;
}

interface ProfileFormErrors {
    first_name?: string;
    last_name?: string;
    birth_date?: string;
    document_id?: string;
    phone_number?: string;
    bio?: string;
    profile_pic?: string;
}
```

---

## Document ID Composite Input

A custom composite component combining a dropdown selector for document type and a text input for the number.

```typescript
// Inline in complete-profile.tsx or extracted to a small component

interface DocumentIdInputProps {
    documentType: string;
    documentNumber: string;
    onTypeChange: (type: string) => void;
    onNumberChange: (number: string) => void;
    isInvalid?: boolean;
    hint?: ReactNode;
}
```

### Rendering

```tsx
<div className="flex flex-col gap-1.5">
    <Label isRequired>Documento de identidad</Label>
    <div className="flex gap-2">
        {/* Type selector — styled as a small select */}
        <select
            value={documentType}
            onChange={(e) => onTypeChange(e.target.value)}
            className="rounded-lg bg-primary px-3 py-2 text-sm ring-1 ring-primary ring-inset"
        >
            <option value="CC">CC</option>
            <option value="TI">TI</option>
            <option value="CE">CE</option>
            <option value="PP">PP</option>
        </select>
        {/* Number input */}
        <InputBase
            placeholder="1234567890"
            value={documentNumber}
            onChange={(e) => onNumberChange(e.target.value)}
            inputMode="numeric"
            isInvalid={isInvalid}
        />
    </div>
    {hint && <HintText isInvalid={isInvalid}>{hint}</HintText>}
</div>
```

The combined value sent to the API is `"${documentType}${documentNumber}"` for the `document_id` field.

---

## Image Cropper Component

### File: `src/components/application/image-cropper/image-cropper.tsx`

A modal overlay that provides a canvas-based square crop tool. Uses no external library — implements crop via `<canvas>` element.

### Interface

```typescript
interface ImageCropperProps {
    /** Source image as an object URL or data URL */
    imageSrc: string;
    /** Output size in pixels (both width and height) */
    outputSize?: number; // default: 400
    /** Called with the cropped image blob */
    onCropComplete: (blob: Blob) => void;
    /** Called when the user cancels */
    onCancel: () => void;
}
```

### Behavior

1. Displays the selected image inside a modal backdrop
2. Overlays a draggable/resizable square selection area (aspect ratio locked to 1:1)
3. Shows "Recortar" (confirm) and "Cancelar" buttons at the bottom
4. On confirm:
   - Creates an offscreen `<canvas>` sized 400x400
   - Draws the selected region of the source image into the canvas
   - Calls `canvas.toBlob()` with `image/jpeg` quality 0.9
   - Passes the blob to `onCropComplete`
5. On cancel: calls `onCancel`

### Simplified Crop Logic

```typescript
function cropImage(
    img: HTMLImageElement,
    cropRect: { x: number; y: number; size: number },
    outputSize: number,
): Promise<Blob> {
    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext("2d")!;

    ctx.drawImage(
        img,
        cropRect.x, cropRect.y, cropRect.size, cropRect.size, // source rect
        0, 0, outputSize, outputSize,                          // dest rect
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error("Crop failed"))),
            "image/jpeg",
            0.9,
        );
    });
}
```

### Modal Styling

- Full-screen overlay: `fixed inset-0 z-50 flex items-center justify-center bg-black/60`
- Content card: `bg-white rounded-2xl overflow-hidden max-w-sm w-full mx-4`
- Image area: centered with `object-contain`, selection overlay with semi-transparent mask
- Buttons: same pattern as other modals — `grid grid-cols-2 gap-3 p-4 border-t`

---

## Location Detection

### Button Component

```tsx
<button
    type="button"
    onClick={handleDetectLocation}
    disabled={isDetectingLocation}
    className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-medium text-secondary transition hover:bg-tertiary"
>
    {isDetectingLocation ? (
        <LoadingSpinner className="size-4" />
    ) : locationDetected ? (
        <CheckCircle className="size-4 text-success-primary" />
    ) : (
        <MarkerPin01 className="size-4" />
    )}
    {locationDetected ? "Ubicación detectada" : "Detectar ubicación"}
</button>
```

### Handler Logic

```typescript
const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    setLocationError(null);

    try {
        const position = await new Promise<GeolocationPosition>(
            (resolve, reject) =>
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                }),
        );

        await api("/api/auth/update-location/", {
            method: "PATCH",
            body: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            },
        });

        setLocationDetected(true);
    } catch (err) {
        setLocationError("No pudimos detectar tu ubicación. Puedes continuar sin ella.");
    } finally {
        setIsDetectingLocation(false);
    }
};
```

---

## API Integration: Multipart Form Data

The profile update endpoint uses `multipart/form-data` because it includes a file upload (`profile_pic`). A new helper function handles this:

```typescript
// Added to src/utils/api.ts or inline in the page

export async function apiMultipart<T>(
    path: string,
    { method = "PATCH", body }: { method?: string; body: FormData },
): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Token ${token}`;
    // Note: do NOT set Content-Type — browser sets it with boundary for multipart

    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body,
    });

    if (res.ok) {
        if (res.status === 204) return undefined as T;
        return res.json() as Promise<T>;
    }

    let fieldErrors: Record<string, string[]> = {};
    try {
        const data = await res.json();
        if (typeof data === "object" && data !== null) {
            if ("detail" in data) {
                fieldErrors = { _general: [data.detail] };
            } else {
                fieldErrors = data as Record<string, string[]>;
            }
        }
    } catch {}

    if (res.status === 401 && getToken()) {
        clearToken();
        window.location.href = "/";
    }

    throw new ApiError(res.status, fieldErrors);
}
```

### Form Submission

```typescript
const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
        const formData = new FormData();
        formData.append("first_name", firstName.trim());
        formData.append("last_name", lastName.trim());
        formData.append("birth_date", birthDate!); // YYYY-MM-DD
        formData.append("document_id", `${documentType}${documentNumber.trim()}`);
        if (phoneNumber.trim()) formData.append("phone_number", phoneNumber.trim());
        if (bio.trim()) formData.append("bio", bio.trim());
        if (profilePicBlob) formData.append("profile_pic", profilePicBlob, "profile.jpg");
        formData.append("onboarding_complete", "true");

        await apiMultipart<Profile>("/api/profile/update/", {
            method: "PATCH",
            body: formData,
        });

        setShowSuccess(true);
        setTimeout(() => navigate("/home", { replace: true }), 2000);
    } catch (err) {
        if (err instanceof ApiError) {
            const fe = err.fieldErrors;
            const newErrors: ProfileFormErrors = {};
            if (fe.first_name) newErrors.first_name = fe.first_name[0];
            if (fe.last_name) newErrors.last_name = fe.last_name[0];
            if (fe.birth_date) newErrors.birth_date = fe.birth_date[0];
            if (fe.document_id) newErrors.document_id = fe.document_id[0];
            if (fe.phone_number) newErrors.phone_number = fe.phone_number[0];
            if (fe.bio) newErrors.bio = fe.bio[0];
            if (fe.profile_pic) newErrors.profile_pic = fe.profile_pic[0];
            setErrors(newErrors);
        }
    } finally {
        setIsSubmitting(false);
    }
};
```

---

## Success Screen

Displayed after successful submission, before auto-redirect:

```tsx
{showSuccess && (
    <motion.div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
    >
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1 }}
        >
            <CheckCircle className="size-16 text-success-primary" />
        </motion.div>
        <h2 className="mt-4 text-display-xs font-bold text-primary">
            ¡Perfil completado!
        </h2>
        <p className="mt-2 text-sm text-tertiary">
            Te estamos llevando a tu comunidad...
        </p>
    </motion.div>
)}
```

---

## Client-Side Validation

```typescript
const validateForm = (): boolean => {
    const newErrors: ProfileFormErrors = {};

    if (!firstName.trim()) newErrors.first_name = "El nombre es requerido";
    if (!lastName.trim()) newErrors.last_name = "El apellido es requerido";
    if (!birthDate) newErrors.birth_date = "La fecha de nacimiento es requerida";
    if (!documentNumber.trim()) newErrors.document_id = "El documento es requerido";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
};
```

Errors clear on field change (same pattern as signup.tsx).

---

## Data Flow Diagram

```
┌──────────────┐     login success      ┌──────────────┐
│    Login     │ ─────────────────────► │  /home route  │
└──────────────┘                        └──────┬───────┘
                                               │
                                    RequireOnboarding
                                    checks profile
                                               │
                            ┌──────────────────┼──────────────────┐
                            │ onboarding=false  │ onboarding=true  │
                            ▼                   ▼                  │
                   ┌─────────────────┐  ┌───────────────┐         │
                   │ /complete-profile│  │  HomeScreen   │ ◄───────┘
                   └────────┬────────┘  └───────────────┘
                            │
                    fills form + submit
                            │
                            ▼
                   ┌─────────────────┐
                   │ PATCH /profile/ │
                   │ update + loc    │
                   └────────┬────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │ Success screen  │ ──── 2s ────► /home
                   └─────────────────┘
```

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Profile fetch 401 | Token cleared, redirect to `/` (handled by api utility) |
| Profile fetch network error | Allow through, form shows |
| Validation error on submit | Inline field errors |
| API 400 on submit | Map `fieldErrors` to form |
| API 500 on submit | Show generic toast/error banner |
| Image too large | FileUpload `maxSize` rejects, show hint |
| Geolocation denied | Show info text, allow continue |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Crop output dimensions are always 400x400

*For any* valid source image (regardless of original dimensions or selected crop region), confirming the crop operation SHALL produce an output image blob whose decoded dimensions are exactly 400x400 pixels.

**Validates: Requirements 2.3**

### Property 2: Empty required fields produce exactly matching validation errors

*For any* subset of required fields (first_name, last_name, birth_date, document_id) left empty at submission time, the validation function SHALL return error messages for exactly those empty fields and no others.

**Validates: Requirements 3.3**

### Property 3: Date serialization round-trip

*For any* valid date value selected in the date picker, formatting it for the API SHALL produce a string matching the `YYYY-MM-DD` pattern, and parsing that string back SHALL yield the same date.

**Validates: Requirements 3.4**

### Property 4: Form submission always includes onboarding_complete flag

*For any* valid combination of form field values submitted, the constructed FormData SHALL always contain the key `onboarding_complete` with value `"true"`.

**Validates: Requirements 5.1**

### Property 5: API field errors map correctly to form fields

*For any* API error response containing field-level errors (DRF format `{ field: ["message"] }`), the error mapping function SHALL assign each field's first error message to the corresponding form error state key, and no other keys SHALL be affected.

**Validates: Requirements 5.3**
