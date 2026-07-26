# Implementation Plan: Contracts Feature

## Overview

Implement the full contract lifecycle in Pa·Hoy: routing and navigation integration, custom data-fetching hooks, contract proposal modal, enhanced chat components, contracts list page with tabs and infinite scroll, contract confirmation page, and contract detail page with timeline. All code is TypeScript/React, building on the existing patterns (React Router 7, React Aria, Motion, `api()` utility, custom hooks).

## Tasks

- [x] 1. Routing, navigation, and type foundations
  - [x] 1.1 Add contract routes to `src/main.tsx`
    - Import `ContractsListPage`, `ContractConfirmationPage`, `ContractDetailPage` from `@/pages/`
    - Add routes: `/contracts`, `/contracts/:contractId`, `/contracts/:contractId/confirm`
    - Wrap each route with `RequireAuth` + `RequireOnboarding` + `PageTransition`
    - Add `/contracts/` to `NO_NAV_ROUTES` so sub-pages hide bottom nav (detail and confirm pages)
    - Verify `/contracts` is already in `NAV_ROUTES` (it is)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [x] 1.2 Add contract-related TypeScript types to `src/types/chat.ts`
    - Add `ContractListItem` interface extending `Contract` with `gig_name`, `gig_front_image`, `counterparty_name`, `counterparty_verified`
    - Add `GigDetail` interface with `id`, `name`, `description`, `price`, `price_type`, `front_image`, `talent`, `talent_info` (nested object)
    - Add `CreateContractPayload` interface
    - Add `CONTRACT_TIMELINE_STEPS` constant
    - _Requirements: 1.3, 3.2, 4.4, 5.2, 5.3_

- [x] 2. Custom hooks for data fetching
  - [x] 2.1 Create `src/hooks/use-contracts-list.ts`
    - Implement `useContractsList(statuses: Contract["status"][])` hook
    - Fetch one request per status from `GET /api/contracts/list/?status=X`
    - Merge results sorted by `updated_at` descending with deduplication by contract ID
    - Support page-number pagination (20 results/page per status) with `loadMore()`
    - Handle loading, error, and retry states following `useChatRooms` pattern
    - _Requirements: 4.1, 4.2, 4.3, 4.9_

  - [x] 2.2 Create `src/hooks/use-contract-detail.ts`
    - Implement `useContractDetail(contractId: string)` hook
    - Fetch contract from `GET /api/contracts/retrieve/:id/`
    - Then fetch gig from `GET /api/gigs/retrieve/:gig_id/` using the contract's gig UUID
    - Return both `contract` and `gig` with loading/error/retry states
    - Handle 404 → "Contrato no encontrado", 401 → redirect handled by api()
    - _Requirements: 3.1, 5.1, 5.4, 5.6_

  - [ ]* 2.3 Write property tests for `useContractsList` merge/sort logic
    - **Property 6: Contracts list is sorted by updated_at descending**
    - **Validates: Requirements 4.1, 4.3**

- [x] 3. Checkpoint - Ensure hooks compile and types are correct
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Contract Proposal Modal
  - [x] 4.1 Create `src/components/application/chat/contract-proposal-modal.tsx`
    - Implement `ContractProposalModal` component using `ModalOverlay` + `Modal` + `Dialog` from existing modal infrastructure
    - Props: `isOpen`, `onClose`, `onSuccess`, `roomId`, `gig` (with id, name, price, price_type)
    - Pre-fill gig name (read-only), price, and price_type from gig data; empty price if gig.price is null
    - Price input: numeric decimal, min 0.01, max 999,999,999.99
    - Price type: radio group with "Fijo" / "Horas"
    - Client-side validation on confirm (empty/non-numeric price → field error, no API call)
    - On confirm: `POST /api/contracts/create/` then `POST /api/chat/rooms/:room_id/messages/` with contract UUID
    - Loading state: spinner on button, inputs disabled
    - Error mapping: field-level errors from 400 response displayed on respective fields
    - On success: call `onSuccess(message)`, close modal
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_

  - [ ]* 4.2 Write property test for price validation logic
    - **Property 1: Price validation rejects invalid inputs**
    - **Validates: Requirements 1.2, 1.9**

  - [ ]* 4.3 Write property test for contract creation + message flow
    - **Property 2: Successful contract creation always produces a chat message**
    - **Validates: Requirements 1.4, 1.5**

- [x] 5. Enhanced ChatInput and ContractCard components
  - [x] 5.1 Update `src/components/application/chat/chat-input.tsx`
    - Add `onSendContract?: () => void` prop to `ChatInputProps`
    - Remove `disabled` from "Enviar Contrato" button
    - Wire button `onClick` to call `onSendContract` when provided
    - _Requirements: 1.1_

  - [x] 5.2 Update `src/components/application/chat/contract-card.tsx`
    - Enable "Ver Contrato" button when `contract.status === "Propuesta"` (remove static `disabled`)
    - Keep button disabled for any other status
    - Add `useNavigate()` and navigate to `/contracts/${contractId}/confirm` on button tap
    - Add "Reintentar" button on error state to re-fetch contract details
    - Handle null price → show "Precio no definido"
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 5.3 Integrate ContractProposalModal in `src/pages/chat-conversation.tsx`
    - Import and render `ContractProposalModal` with open/close state
    - Pass `onSendContract` callback to `ChatInput` to open the modal
    - Pass `roomId`, `gig` data, and `onSuccess` handler (appends message to conversation)
    - _Requirements: 1.1, 1.5, 1.8_

  - [ ]* 5.4 Write property test for ContractCard button state logic
    - **Property 3: Contract card display respects status-based button state**
    - **Validates: Requirements 2.3, 2.4**

  - [ ]* 5.5 Write property test for ContractCard sender identity display
    - **Property 4: Contract card visibility depends on sender identity**
    - **Validates: Requirements 2.8, 2.9**

- [x] 6. Checkpoint - Verify chat integration works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Contracts List Page
  - [x] 7.1 Create `src/pages/contracts-list.tsx`
    - Page header: "Contratos" title
    - `Tabs` component with two tabs: "En Curso" (default), "Historial"
    - "En Curso" tab: uses `useContractsList(["Activo", "Confirmado"])`
    - "Historial" tab: uses `useContractsList(["Concluido", "Cancelado"])`
    - Each card: gig thumbnail, gig name, counterparty name + badge, relative date, status icon, price
    - Tap item → navigate to `/contracts/:contractId`
    - Infinite scroll: loads next page when scroll within 200px of bottom
    - Empty state: illustration + contextual message per tab
    - Loading state: skeleton placeholders
    - Error state: error message + "Reintentar" button
    - Use `motion.div` entrance animation per design patterns
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9_

  - [ ]* 7.2 Write property test for tab filter correctness
    - **Property 5: Tab filter returns only contracts with matching statuses**
    - **Validates: Requirements 4.2, 4.3**

- [x] 8. Contract Confirmation Page
  - [x] 8.1 Create `src/pages/contract-confirmation.tsx`
    - Route: `/contracts/:contractId/confirm`
    - Use `useContractDetail(contractId)` hook for data fetching
    - Header: back button (ChevronLeft) + title "Confirmar Contratación"
    - Content: gig front_image, gig name, talent name + badge, rating, contract price, price type, status badge
    - Animate content with `motion.div` (opacity + y transition)
    - Bottom-pinned CTA: "Sí, contratar a {talent_first_name}" with checkmark icon
    - On CTA tap: `PATCH /api/contracts/accept/:id/` → navigate to `/contracts/:id`
    - Loading state: centered `LoadingIndicator`
    - Error (404): message + back navigation
    - Accept in-progress: "Confirmando..." spinner, button disabled
    - Accept error: display below CTA in `text-error-primary`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

- [x] 9. Contract Detail Page
  - [x] 9.1 Create `src/pages/contract-detail.tsx`
    - Route: `/contracts/:contractId`
    - Use `useContractDetail(contractId)` hook
    - Header: back button (ChevronLeft) + title "Detalle de contratación"
    - Status badge (colored by status)
    - Price + price type
    - Timeline progress indicator using `CONTRACT_TIMELINE_STEPS`
    - Mark steps as complete based on status ordering (Propuesta → Activo → Confirmado → Concluido)
    - Special indicator for "Cancelado" and "Disputa" statuses
    - Gig info: name, talent name
    - Created/updated dates in locale format (e.g., "miércoles 23 de julio")
    - If status "Activo" or "Confirmado": "Cancelar contratación" button at bottom
    - Loading state: centered spinner
    - Error (404/401): error message + back button
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

  - [ ]* 9.2 Write property test for timeline completion logic
    - **Property 7: Timeline completion reflects status ordering**
    - **Validates: Requirements 5.3**

  - [ ]* 9.3 Write property test for currency formatting round-trip
    - **Property 8: Currency formatting preserves numeric value**
    - **Validates: Requirements 2.1, 4.4, 5.2**

- [x] 10. Final checkpoint - Full integration verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The existing `BottomNavigation` already includes the "Contratos" tab with `ClipboardCheck` icon — no modification needed
- `NAV_ROUTES` already includes `/contracts` — only `NO_NAV_ROUTES` needs updating for sub-pages
- All hooks follow the `useChatRooms` pattern: useState + useEffect + AbortController + api() utility

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "2.2"] },
    { "id": 2, "tasks": ["2.3", "4.1"] },
    { "id": 3, "tasks": ["4.2", "4.3", "5.1", "5.2"] },
    { "id": 4, "tasks": ["5.3", "5.4", "5.5"] },
    { "id": 5, "tasks": ["7.1", "8.1", "9.1"] },
    { "id": 6, "tasks": ["7.2", "9.2", "9.3"] }
  ]
}
```
