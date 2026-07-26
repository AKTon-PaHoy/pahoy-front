# Implementation Plan: Chat Feature

## Overview

Implement the full chat system for Pa·Hoy, enabling messaging between clients and talent. The implementation follows a bottom-up approach: types → utilities → hooks → components → pages → route wiring → existing page modifications.

## Tasks

- [x] 1. Define data types and utility functions
  - [x] 1.1 Create chat type definitions
    - Create `src/types/chat.ts` with interfaces: `ChatRoom`, `Message`, `Contract`, `PaginatedResponse<T>`
    - Types must match the API response shapes defined in the design document
    - _Requirements: 2.1, 2.9, 4.2, 6.1, 7.1_

  - [x] 1.2 Create chat utility functions
    - Create `src/utils/chat.ts` with pure functions:
      - `sortMessages(messages: Message[]): Message[]` — sorts by timestamp ascending, UUID tie-breaker
      - `deduplicateMessages(existing: Message[], incoming: Message[]): Message[]` — merges two arrays by UUID, returns unique sorted result
      - `isValidMessageContent(content: string): boolean` — true if 1+ non-whitespace char and ≤10,000 chars
      - `formatMessageTimestamp(isoTimestamp: string): string` — relative time if <24h, "DD/MM/YYYY HH:mm" otherwise
      - `truncatePreview(text: string, maxLength?: number): string` — truncates at 80 chars with "…" if longer
      - `resolveOtherParticipant(room: ChatRoom, currentUserId: string): string` — returns the other participant's name from `participant_names`
    - _Requirements: 2.1, 2.4, 2.9, 3.2, 4.2, 5.1, 7.2_

  - [ ]* 1.3 Write property tests for chat utilities
    - **Property 1: Message ordering is consistent** — verify sortMessages produces ascending timestamp order with UUID tie-breaker
    - **Property 4: Message deduplication preserves uniqueness** — verify deduplicateMessages produces exactly N unique UUIDs
    - **Property 5: Message content validation** — verify isValidMessageContent accepts valid inputs and rejects invalid ones
    - **Property 6: Other participant name resolution** — verify resolveOtherParticipant returns the non-current-user name
    - **Property 8: Message preview truncation** — verify truncatePreview clips at 80 chars with ellipsis
    - Create test file at `src/utils/__tests__/chat-properties.test.ts` using Vitest + fast-check
    - **Validates: Requirements 2.1, 2.9, 3.2, 3.6, 3.7, 4.2, 5.1, 7.2**

- [x] 2. Implement custom hooks
  - [x] 2.1 Create useCurrentUser hook
    - Create `src/hooks/use-current-user.ts`
    - Calls `GET /api/auth/user/` on mount, caches result in a module-level variable
    - Returns `{ user: { id: string } | null, isLoading: boolean, error: boolean }`
    - Avoids redundant fetches when called from multiple components
    - _Requirements: 1.1, 1.2, 2.2, 2.3, 5.1, 6.2, 6.3_

  - [x] 2.2 Create useChatRooms hook
    - Create `src/hooks/use-chat-rooms.ts`
    - Fetches `GET /api/chat/rooms/` with token auth on mount
    - Manages paginated state: rooms array, next URL, loading flags, error state
    - Exposes `loadMore()` for infinite scroll, `retry()` for error recovery
    - Prevents duplicate concurrent requests via loading flag
    - _Requirements: 7.1, 7.6, 7.7, 7.8_

  - [x] 2.3 Create useChatMessages hook
    - Create `src/hooks/use-chat-messages.ts`
    - Fetches initial messages from `GET /api/chat/rooms/{roomId}/messages/`, reverses for chronological order
    - Maintains internal `Map<string, Message>` for O(1) deduplication
    - Exposes sorted message array (timestamp ascending, UUID tie-breaker)
    - Implements 5-second polling with `after_id` parameter; pauses when tab is hidden, resumes with immediate poll on visibility
    - Cancels in-flight requests on unmount via AbortController
    - `loadOlderMessages()` fetches next page and prepends
    - `sendMessage(content, attachment?)` uses apiMultipart when attachment present, api otherwise
    - _Requirements: 2.1, 2.6, 2.7, 2.8, 2.9, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 3. Checkpoint - Verify hooks and utilities
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement chat UI components
  - [x] 4.1 Create MessageBubble component
    - Create `src/components/application/chat/message-bubble.tsx`
    - Props: `content`, `senderUsername`, `timestamp`, `isOwnMessage`, `attachment?`
    - Right-aligned with `bg-brand-50` for own messages, left-aligned with `bg-neutral-50` for others
    - Shows sender username in `text-xs text-tertiary` above bubble
    - Shows formatted timestamp below bubble using `formatMessageTimestamp`
    - Renders attachment as clickable link/image when present
    - _Requirements: 2.2, 2.3, 2.4_

  - [x] 4.2 Create ContractCard component
    - Create `src/components/application/chat/contract-card.tsx`
    - Props: `contractId`, `isOwnMessage`, `isClient`, `timestamp`
    - When talent sent it (`isOwnMessage && !isClient`): renders "Contrato enviado" in brand-red, right-aligned
    - When client viewing: fetches contract via `GET /api/contracts/retrieve/{id}/`, shows price, status badge, action area placeholder, left-aligned
    - Error state: "Detalles del contrato no disponibles" with timestamp
    - _Requirements: 6.1, 6.2, 6.3, 6.5_

  - [x] 4.3 Create ChatInput component
    - Create `src/components/application/chat/chat-input.tsx`
    - Props: `onSend`, `isSending`, `sendError`, `isGigOwner`
    - Text input with 10,000 character limit (prevent input beyond limit)
    - Character counter shown when >9,500 chars
    - Send button disabled when empty/whitespace or isSending
    - Inline error below input on send failure
    - "Send Contract" placeholder button when `isGigOwner` is true (non-functional)
    - _Requirements: 3.1, 3.4, 3.5, 3.6, 3.7, 6.4_

  - [x] 4.4 Create RoomItem component
    - Create `src/components/application/chat/room-item.tsx`
    - Props: `otherParticipantName`, `lastMessage`, `createdAt`, `onClick`
    - Displays participant name, truncated last_message (80 chars max with "…"), formatted timestamp
    - Shows placeholder text when lastMessage is null
    - Tappable row that calls onClick
    - _Requirements: 7.2, 7.3, 7.4_

  - [ ]* 4.5 Write property tests for rendering logic
    - **Property 2: Message alignment is determined by sender identity** — verify alignment logic based on sender vs currentUser
    - **Property 3: Timestamp formatting threshold** — verify relative vs absolute format based on 24h threshold
    - **Property 7: Contract message rendering mode** — verify contract !== null triggers card rendering
    - Create test file at `src/components/application/chat/__tests__/chat-render-properties.test.ts`
    - **Validates: Requirements 2.2, 2.3, 2.4, 6.1**

- [x] 5. Implement chat pages
  - [x] 5.1 Create ChatList page
    - Create `src/pages/chat-list.tsx`
    - Uses `useChatRooms` for data, `useCurrentUser` for participant resolution
    - Renders `RoomItem` for each room with resolved other participant name
    - Handles empty state ("No tienes conversaciones"), loading state, error state with retry
    - Infinite scroll: triggers `loadMore()` when user scrolls within 200px of bottom
    - Each room item navigates to `/messages/:roomId` on tap
    - Follows page layout patterns: `min-h-dvh flex flex-col bg-white`, motion.div animation
    - Header with back button, brand logo, title "Mensajes"
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

  - [x] 5.2 Create ChatConversation page
    - Create `src/pages/chat-conversation.tsx`
    - Uses `useChatMessages(roomId)` for messages, `useCurrentUser` for alignment
    - Renders `MessageBubble` or `ContractCard` based on `message.contract`
    - Header: other participant's name + back button (navigate(-1) or fallback to `/messages`)
    - Chat input at bottom using `ChatInput` component
    - Empty state when no messages: "No tienes mensajes"
    - Infinite scroll upward for older messages (triggers `loadOlderMessages`)
    - Preserves scroll position when prepending older messages
    - Determines `isGigOwner` and `isClient` from room data for contract rendering
    - Follows page layout patterns with motion.div animation
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.4, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4_

- [x] 6. Checkpoint - Verify pages and components
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Route registration and navigation integration
  - [x] 7.1 Register chat routes in main.tsx
    - Add `/messages` route rendering `ChatList` wrapped with `RequireAuth → RequireOnboarding → PageTransition`
    - Add `/messages/:roomId` route rendering `ChatConversation` wrapped with `RequireAuth → RequireOnboarding → PageTransition`
    - Add `/messages/:roomId` pattern to `NO_NAV_ROUTES` array to hide bottom nav on conversation view
    - Add `/messages` to `NAV_ROUTES` array (already present) to show bottom nav on list view
    - Import `ChatList` and `ChatConversation` pages
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 7.2 Update bottom navigation active state
    - Verify the "Mensajes" tab at `/messages` path in bottom-navigation config already matches routes
    - Confirm `aria-current="page"` and brand-600 color are applied when path starts with `/messages`
    - Confirm tapping "Mensajes" tab navigates to `/messages` (already wired in existing component)
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 8. Modify Gig Overview page for room creation
  - [x] 8.1 Add owner detection and conditional "Chatear" button
    - In `src/pages/gig-overview.tsx`, use `useCurrentUser` hook to get current user UUID
    - Compare `user.id` with `gig.talent` to determine if current user is the gig owner
    - Hide "Chatear" button when user is gig owner
    - Show "Chatear" button only when user is NOT the gig owner
    - _Requirements: 1.1, 1.2_

  - [x] 8.2 Implement room creation flow on "Chatear" tap
    - On tap: disable button, show spinner, send `POST /api/chat/rooms/create/` with `{ "gig": id }`
    - On success (200/201): navigate to `/messages/:roomId` using returned room id
    - On 400 error: show inline error, re-enable button, preserve scroll position
    - On 401: handled by `api()` utility (redirects to splash)
    - On network/5xx error: show connection error, re-enable button
    - 15-second timeout: re-enable button with timeout error if no response
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

- [x] 9. Final checkpoint - Full integration verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The design uses TypeScript throughout — all implementations use TypeScript
- Use `api()` from `@/utils/api` for JSON calls and `apiMultipart()` for file uploads
- Follow existing page patterns (motion.div animations, header layout, Tailwind styling)
- Bottom navigation already has "Mensajes" entry at `/messages` — verify it works with new routes

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["1.3", "2.2", "2.3"] },
    { "id": 3, "tasks": ["4.1", "4.2", "4.3", "4.4"] },
    { "id": 4, "tasks": ["4.5", "5.1", "5.2"] },
    { "id": 5, "tasks": ["7.1", "7.2"] },
    { "id": 6, "tasks": ["8.1"] },
    { "id": 7, "tasks": ["8.2"] }
  ]
}
```
