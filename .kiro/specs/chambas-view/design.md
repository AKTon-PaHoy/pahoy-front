# Design Document: Chambas (My Gigs) View

## Architecture Overview

The Chambas view is a page-level component rendered at the `/gigs` route. It follows the same architectural patterns established by `HomeScreen`: a single page component that fetches data on mount, manages local state for loading/error/data, and renders a list of cards. The route is protected by the existing `RequireAuth` and `RequireOnboarding` guards already in place in `main.tsx`.

### Component Hierarchy

```
Routes (main.tsx)
└── /gigs → RequireAuth → RequireOnboarding → PageTransition
    └── ChambasScreen
        ├── Header ("Mis Chambas")
        ├── TabFilter (Todas | Activas | Inactivas)
        ├── Loading State (spinner)
        ├── Error State (message + retry button)
        ├── Empty State (contextual per tab)
        └── Gig List
            └── GigCard[] (extended ServiceCard with StatusBadge)
```

## Components

### 1. `ChambasScreen` (Page Component)

**File:** `src/pages/chambas-screen.tsx`

This is the main page component responsible for:
- Fetching the user's gigs from `/api/gigs/my-gigs/`
- Managing tab filter state
- Rendering loading, error, empty, and data states
- Animating content on mount via `motion.div`

### 2. `TabFilter` (Inline Component)

A set of three tab buttons rendered inline within `ChambasScreen`. Not extracted as a separate file given its simplicity and single-use nature.

**Tabs:**
| Label | API Parameter |
|-------|---------------|
| Todas | (none) |
| Activas | `?is_active=true` |
| Inactivas | `?is_active=false` |

### 3. `GigCard` (Extended ServiceCard)

Rather than modifying the shared `ServiceCard` component (which is used by other views), the `ChambasScreen` renders each gig using a custom card layout that includes the `StatusBadge`. This keeps the shared component stable.

### 4. `StatusBadge` (Inline Element)

A small badge rendered on each card:
- **Active:** `bg-success-50 text-success-700` → "Activa"
- **Inactive:** `bg-neutral-100 text-neutral-600` → "Inactiva"

## Interfaces & Data Models

### Gig Type (from API)

```typescript
interface Gig {
    id: string;           // UUID
    talent: string;       // UUID
    name: string;
    description: string;
    gig_front_img: string | null;
    gig_secong_img: string | null;
    gig_third_img: string | null;
    price: number;
    price_type: "Fijo" | "Horas";
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
```

### API Response Type

```typescript
interface PaginatedGigResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Gig[];
}
```

### Tab Filter Type

```typescript
type TabFilter = "todas" | "activas" | "inactivas";
```

### Component State

```typescript
interface ChambasState {
    gigs: Gig[];
    isLoading: boolean;
    error: string | null;
    activeTab: TabFilter;
}
```

## Data Flow

1. **Mount:** Component mounts → fetches `/api/gigs/my-gigs/` → displays results
2. **Tab Change:** User taps tab → sets `isLoading = true` → fetches with filter → updates `gigs`
3. **Error:** API fails (non-401) → sets `error` message → shows retry button
4. **Retry:** User taps "Reintentar" → clears error → re-fetches with current tab filter
5. **401 Handling:** Automatically handled by the `api()` utility (clears token, redirects to `/`)

### Fetch Logic

```typescript
const fetchGigs = async (tab: TabFilter) => {
    setIsLoading(true);
    setError(null);
    try {
        const params = tab === "activas"
            ? "?is_active=true"
            : tab === "inactivas"
            ? "?is_active=false"
            : "";
        const response = await api<PaginatedGigResponse>(`/api/gigs/my-gigs/${params}`);
        setGigs(response.results);
    } catch (err) {
        if (err instanceof ApiError && err.status !== 401) {
            setError("No pudimos cargar tus chambas");
        }
    } finally {
        setIsLoading(false);
    }
};
```

## Price Formatting Logic

```typescript
function formatPrice(price: number, priceType: "Fijo" | "Horas"): string {
    if (priceType === "Horas") {
        return `$${price}/hr`;
    }
    return `Desde $${price}`;
}
```

## Empty State Messages

| Tab | Heading | Description |
|-----|---------|-------------|
| Todas | "Aún no tienes chambas" | "Crea tu primera chamba y empieza a recibir clientes" |
| Activas | "No tienes chambas activas" | — |
| Inactivas | "No tienes chambas inactivas" | — |

## Route Registration

Add to `main.tsx` within the `AnimatedRoutes` component:

```typescript
<Route
    path="/gigs"
    element={
        <RequireAuth>
            <RequireOnboarding>
                <PageTransition>
                    <ChambasScreen />
                </PageTransition>
            </RequireOnboarding>
        </RequireAuth>
    }
/>
```

The `/gigs` path is already included in `NAV_ROUTES`, so the `BottomNavigation` will automatically show when on this route.

## Animation

Content area uses `motion.div` matching the project pattern:

```typescript
<motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, ease: "easeOut" }}
>
    {/* Tab filter + content */}
</motion.div>
```

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Network error | Shows error state with retry |
| 401 Unauthorized | `api()` utility clears token and redirects to `/` |
| 500 Server Error | Shows "No pudimos cargar tus chambas" + "Reintentar" |
| Empty results | Shows contextual empty state per active tab |

## Accessibility

- Tab buttons use `role="tab"` with `aria-selected` for the active tab
- Tab list container uses `role="tablist"`
- Loading spinner has `aria-label="Cargando"` for screen readers
- Gig cards are interactive and use semantic button/link patterns for navigation
- Status badges use `aria-label` to convey status to assistive technology

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Gig count matches rendered cards

*For any* array of gig results returned by the API, the number of rendered Gig_Card elements SHALL equal the length of the results array.

**Validates: Requirements 2.3**

### Property 2: Status badge correctness

*For any* gig object, if `is_active` is true the badge SHALL display "Activa" with success styling, and if `is_active` is false the badge SHALL display "Inactiva" with neutral styling.

**Validates: Requirements 4.2**

### Property 3: Navigation targets match gig IDs

*For any* gig with a UUID `id`, tapping the corresponding Gig_Card SHALL trigger navigation to the path `/gig/{id}`.

**Validates: Requirements 4.3**

### Property 4: Price formatting by type

*For any* gig with price `p` and price_type `t`, the displayed price SHALL be `"Desde $p"` when `t` is "Fijo", or `"$p/hr"` when `t` is "Horas".

**Validates: Requirements 4.4**
