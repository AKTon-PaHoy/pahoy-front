# Design Document: Nueva Chamba (Create New Gig)

## Architecture Overview

The Nueva Chamba feature is a page-level component rendered at the `/gigs/new` route. It follows the same architectural patterns established by `Signup` and `ChambasScreen`: a single page component with local state for form data, validation errors, and submission status. The route is protected by the existing `RequireAuth` and `RequireOnboarding` guards. Data is submitted via `apiMultipart()` as multipart/form-data to support image file uploads.

### Component Hierarchy

```
Routes (main.tsx)
└── /gigs/new → RequireAuth → RequireOnboarding → PageTransition
    └── NuevaChambaScreen
        ├── Header (back button + logo + spacer)
        ├── Title ("Nueva Chamba")
        └── GigForm
            ├── Input (Nombre de la chamba)
            ├── Textarea (Descripción)
            ├── ImageUploadSection
            │   ├── ImageSlot (front)
            │   ├── ImageSlot (second)
            │   └── ImageSlot (third)
            ├── Input (Precio)
            ├── PriceTypeSelector (Fijo | Horas)
            ├── Toggle (Activa)
            ├── Input (Tags)
            ├── Spacer (flex-1)
            └── Submit Button (CTA)
```

## Components

### 1. `NuevaChambaScreen` (Page Component)

**File:** `src/pages/nueva-chamba-screen.tsx`

The main page component responsible for:
- Managing all form field state (controlled inputs)
- Client-side validation on submit
- Building FormData and calling `apiMultipart()`
- Mapping backend errors to field-level error state
- Navigating to `/gigs` on success

### 2. `ImageUploadSection` (Inline Component)

Rendered inline within `NuevaChambaScreen`. Manages up to three image slots (front, second, third). Each slot:
- Displays a placeholder when empty (camera/plus icon)
- Opens a native file picker on tap
- Validates image dimensions (400–2000px)
- Opens `ImageCropper` for square crop
- Shows a thumbnail preview after cropping
- Provides remove/replace on tap when filled

### 3. `PriceTypeSelector` (Inline Component)

A segmented control or radio group with two options:
- "Fijo" (fixed price) — default selected
- "Horas" (hourly rate)

Uses React Aria `RadioGroup` for accessibility.

## Interfaces & Data Models

### Form State

```typescript
interface GigFormState {
    name: string;
    description: string;
    price: string;              // string for controlled input, parsed on submit
    priceType: "Fijo" | "Horas";
    isActive: boolean;
    tags: string;
    frontImage: Blob | null;
    secondImage: Blob | null;
    thirdImage: Blob | null;
}
```

### Form Errors

```typescript
interface GigFormErrors {
    name?: string;
    description?: string;
    price?: string;
    gig_front_img?: string;
    gig_secong_img?: string;
    gig_third_img?: string;
    tags?: string;
    _general?: string;
}
```

### Image Slot State

```typescript
interface ImageSlotState {
    blob: Blob | null;
    previewUrl: string | null;
}
```

### API Request (FormData keys)

| Form Field | FormData Key | Type |
|-----------|-------------|------|
| name | `name` | string |
| description | `description` | string |
| front image | `gig_front_img` | File/Blob |
| second image | `gig_secong_img` | File/Blob |
| third image | `gig_third_img` | File/Blob |
| price | `price` | string (decimal) |
| price type | `price_type` | "Fijo" \| "Horas" |
| is active | `is_active` | "true" \| "false" |
| tags | `tags` | string (optional) |

## Data Flow

1. **Mount:** Component renders empty form with defaults (`priceType: "Fijo"`, `isActive: true`)
2. **Input:** User fills fields, state updates via controlled inputs
3. **Image Upload:** User taps slot → file picker → dimension validation → ImageCropper → blob stored in state + preview URL generated via `URL.createObjectURL()`
4. **Submit:** User taps "Crear Chamba" → `validateForm()` runs → if valid, builds `FormData` → calls `apiMultipart()` → on success navigates to `/gigs`
5. **Error (client):** Validation fails → sets field errors → errors render via `hint` + `isInvalid` props
6. **Error (server):** API returns error → maps `fieldErrors` to form state → displays on relevant fields
7. **401 Handling:** Automatically handled by `apiMultipart()` utility (clears token, redirects to `/`)

### Validation Logic

```typescript
function validateForm(state: GigFormState): GigFormErrors {
    const errors: GigFormErrors = {};

    if (!state.name.trim()) {
        errors.name = "El nombre es requerido";
    }

    if (!state.description.trim()) {
        errors.description = "La descripción es requerida";
    }

    const priceNum = parseFloat(state.price);
    if (!state.price.trim() || isNaN(priceNum) || priceNum <= 0) {
        errors.price = "El precio debe ser mayor a 0";
    }

    return errors;
}
```

### FormData Construction

```typescript
function buildFormData(state: GigFormState): FormData {
    const fd = new FormData();
    fd.append("name", state.name.trim());
    fd.append("description", state.description.trim());
    fd.append("price", state.price.trim());
    fd.append("price_type", state.priceType);
    fd.append("is_active", String(state.isActive));

    if (state.tags.trim()) {
        fd.append("tags", state.tags.trim());
    }

    if (state.frontImage) {
        fd.append("gig_front_img", state.frontImage, "front.jpg");
    }
    if (state.secondImage) {
        fd.append("gig_secong_img", state.secondImage, "second.jpg");
    }
    if (state.thirdImage) {
        fd.append("gig_third_img", state.thirdImage, "third.jpg");
    }

    return fd;
}
```

### Submission Handler

```typescript
const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm(formState);
    if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
    }

    setIsSubmitting(true);
    try {
        const formData = buildFormData(formState);
        await apiMultipart("/api/gigs/create/", {
            method: "POST",
            body: formData,
        });
        navigate("/gigs");
    } catch (err) {
        if (err instanceof ApiError) {
            const newErrors: GigFormErrors = {};
            const fe = err.fieldErrors;
            if (fe.name) newErrors.name = fe.name[0];
            if (fe.description) newErrors.description = fe.description[0];
            if (fe.price) newErrors.price = fe.price[0];
            if (fe.gig_front_img) newErrors.gig_front_img = fe.gig_front_img[0];
            if (fe.gig_secong_img) newErrors.gig_secong_img = fe.gig_secong_img[0];
            if (fe.gig_third_img) newErrors.gig_third_img = fe.gig_third_img[0];
            if (fe.tags) newErrors.tags = fe.tags[0];
            if (fe.non_field_errors) newErrors._general = fe.non_field_errors[0];
            if (fe._general) newErrors._general = fe._general[0];
            setErrors(newErrors);
        }
    } finally {
        setIsSubmitting(false);
    }
};
```

## Image Dimension Validation

```typescript
function validateImageDimensions(file: File): Promise<{ valid: boolean; width: number; height: number }> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const valid = img.width >= 400 && img.width <= 2000
                       && img.height >= 400 && img.height <= 2000;
            resolve({ valid, width: img.width, height: img.height });
            URL.revokeObjectURL(img.src);
        };
        img.onerror = () => resolve({ valid: false, width: 0, height: 0 });
        img.src = URL.createObjectURL(file);
    });
}
```

## Route Registration

Add to `main.tsx` within the `AnimatedRoutes` component:

```typescript
<Route
    path="/gigs/new"
    element={
        <RequireAuth>
            <RequireOnboarding>
                <PageTransition>
                    <NuevaChambaScreen />
                </PageTransition>
            </RequireOnboarding>
        </RequireAuth>
    }
/>
```

## Animation

Content area uses `motion.div` matching the project pattern:

```typescript
<motion.div
    className="flex flex-1 flex-col px-4 pt-6"
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, ease: "easeOut" }}
>
    {/* Form content */}
</motion.div>
```

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Empty required fields on submit | Shows field-level error messages via `hint` prop |
| Price <= 0 | Shows "El precio debe ser mayor a 0" |
| Image dimensions out of range | Shows error below image section |
| Network error | Shows generic error via `_general` |
| 401 Unauthorized | `apiMultipart()` clears token and redirects to `/` |
| Backend field errors | Mapped 1:1 to form fields |
| Duplicate submit | Button disabled during submission |

## Accessibility

- All inputs use the `<Input>` component with `label` and `isRequired` props for proper `aria-label` and `aria-required`
- `<Textarea>` component provides accessible labeling
- `PriceTypeSelector` uses React Aria `RadioGroup` with `aria-label` and proper role semantics
- Toggle uses the existing `Toggle` component from `@/components/base/toggle`
- Submit button communicates loading state via `aria-busy` and disabled state via `aria-disabled`
- Image slots use `role="button"` with descriptive `aria-label` (e.g., "Subir imagen principal")
- Error messages are linked to fields via `aria-describedby`

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Client-side validation rejects invalid form states

*For any* form state where at least one required field (name, description, price) is empty or invalid (price <= 0), submitting the form SHALL produce a non-empty errors object and SHALL NOT call the Create_Gig_API.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

### Property 2: Typing in an errored field clears its error

*For any* form field that currently has an active error message, when the user provides any non-empty input change to that field, the error for that specific field SHALL be cleared while errors on other fields remain unchanged.

**Validates: Requirements 4.5**

### Property 3: Image dimension validation

*For any* image with width W and height H, the dimension validation function SHALL return valid=true if and only if 400 <= W <= 2000 AND 400 <= H <= 2000.

**Validates: Requirements 3.3, 3.4**

### Property 4: FormData construction round-trip

*For any* valid form state (non-empty name, non-empty description, price > 0, priceType in {"Fijo","Horas"}, isActive boolean), the `buildFormData` function SHALL produce a FormData object containing exactly the expected keys mapped to their correct values as specified by the API contract.

**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7**

### Property 5: Backend error mapping preserves field association

*For any* API error response containing field-level errors (a record of field names to arrays of error strings), the error mapping logic SHALL assign the first error string of each recognized field to the corresponding form error key, with no cross-contamination between fields.

**Validates: Requirements 6.1**

### Property 6: Validation does not trigger on blur

*For any* field in the form, losing focus (blur event) SHALL NOT cause validation errors to appear. Errors SHALL only appear after a form submission attempt.

**Validates: Requirements 4.6**
