# Requirements Document

## Introduction

Full chat system for the Pa·Hoy app enabling real-time messaging between clients and talent (gig owners). The feature covers room creation from the Gig Overview page, a conversation view with message history and polling-based sync, a chat list view showing all conversations, and contract message rendering within chat bubbles.

## Glossary

- **Chat_System**: The set of frontend components, pages, and logic that enable text-based messaging between Pa·Hoy users within the context of a Gig.
- **Chat_Room**: A conversation context between exactly two participants (client and gig owner) tied to a specific Gig.
- **Chat_List_View**: The page at `/messages` that displays all chat rooms for the authenticated user.
- **Conversation_View**: The page at `/messages/:roomId` that displays message history and allows sending new messages within a specific Chat_Room.
- **Message**: A text entry within a Chat_Room containing content, sender identity, timestamp, and optionally a contract reference or attachment.
- **Contract_Card**: A special rendering of a Message that has a non-null `contract` field, displayed as a styled card with contract details.
- **Current_User**: The authenticated user whose identity is obtained via `GET /api/auth/user/`.
- **Gig_Owner**: The talent who created and owns a Gig.
- **Polling_Sync**: A mechanism that periodically fetches new messages using the `after_id` query parameter at a fixed interval.
- **Bottom_Navigation**: The persistent navigation bar at the bottom of the app that provides access to main sections.

## Requirements

### Requirement 1: Chat Room Creation from Gig Overview

**User Story:** As a client, I want to start a chat with a gig owner from the Gig Overview page, so that I can discuss the service before hiring.

#### Acceptance Criteria

1. WHEN the authenticated user's UUID does not match the Gig's `talent` UUID (from the Gig retrieve response), THE Chat_System SHALL display a "Chatear" button fixed at the bottom of the Gig Overview page.
2. WHEN the authenticated user's UUID matches the Gig's `talent` UUID, THE Chat_System SHALL hide the "Chatear" button so the owner cannot initiate a chat with themselves.
3. WHEN the user taps the "Chatear" button, THE Chat_System SHALL send a `POST /api/chat/rooms/create/` request with the body `{ "gig": "<Gig UUID>" }` using TokenAuth and SHALL disable the button and display a loading indicator within 100ms to prevent duplicate submissions.
4. WHEN the room creation API responds with status 200 or 201, THE Chat_System SHALL navigate to `/messages/:roomId` using the `id` field (UUID) from the returned ChatRoom object.
5. IF the room creation API responds with a 400 error (e.g., talent attempting to chat on own Gig or validation failure), THEN THE Chat_System SHALL display an inline error message indicating the room could not be created, re-enable the "Chatear" button, and remain on the current page without losing scroll position.
6. IF the room creation API responds with a 401 error, THEN THE Chat_System SHALL redirect the user to the login flow.
7. IF the room creation API responds with a network failure or a 5xx server error, THEN THE Chat_System SHALL display an error message indicating a connection problem, re-enable the "Chatear" button, and remain on the current page.
8. WHILE the room creation request is in progress, THE Chat_System SHALL show the "Chatear" button in a disabled state with a loading indicator (spinner) and SHALL prevent any additional taps from triggering duplicate requests until the response is received or a timeout of 15 seconds elapses.

### Requirement 2: Conversation View - Message Display

**User Story:** As a user, I want to see the message history in a conversation, so that I can follow the discussion context.

#### Acceptance Criteria

1. WHEN the Conversation_View loads for a given room, THE Chat_System SHALL fetch messages from `GET /api/chat/rooms/{room_id}/messages/` and display them in chronological order (oldest at top, newest at bottom), reversing the API's newest-first response order before rendering.
2. THE Chat_System SHALL display messages from the Current_User (matched by comparing the message `sender` UUID to the authenticated user's UUID) in right-aligned bubbles with brand color background.
3. THE Chat_System SHALL display messages from the other participant in left-aligned bubbles with neutral color background.
4. THE Chat_System SHALL display the `sender_username` and a human-readable timestamp (formatted as relative time for messages less than 24 hours old, or as "DD/MM/YYYY HH:mm" otherwise) for each Message.
5. WHEN the conversation contains no messages (API returns `count: 0` or an empty results array), THE Chat_System SHALL display an empty state illustration with the text "No tienes mensajes".
6. WHEN the user scrolls upward and reaches the top of the currently loaded messages, THE Chat_System SHALL fetch the next page of older messages using the server-provided `next` pagination URL, prepend messages to the conversation, and preserve the user's current scroll position so the viewport does not jump.
7. WHILE a page of messages is being fetched (initial load or older-history load), THE Chat_System SHALL display a loading indicator positioned at the top of the message list for older-history loads or centered in the view for initial loads.
8. IF the messages fetch returns a 404 response, THEN THE Chat_System SHALL display an error message indicating the conversation is unavailable and prevent further message-fetch attempts for that room.
9. THE Chat_System SHALL deduplicate messages by their `id` UUID when merging pages, ensuring no message appears more than once regardless of pagination overlap caused by new incoming messages.

### Requirement 3: Conversation View - Sending Messages

**User Story:** As a user, I want to send text messages in a conversation, so that I can communicate with the other participant.

#### Acceptance Criteria

1. THE Chat_System SHALL display a text input field (maximum 10,000 characters) and a send button at the bottom of the Conversation_View.
2. WHEN the user submits a message containing at least 1 non-whitespace character and not exceeding 10,000 characters, THE Chat_System SHALL send a `POST /api/chat/rooms/{room_id}/messages/` request with the `room` UUID and trimmed `content` in the body.
3. WHEN the send message API responds with status 201, THE Chat_System SHALL append the returned message to the bottom of the conversation display and clear the text input field.
4. WHILE the message send request is in progress, THE Chat_System SHALL disable the send button and the text input field to prevent duplicate submissions.
5. IF the message send request fails with a network error or non-2xx response, THEN THE Chat_System SHALL display an inline error message below the input field indicating the message was not sent, retain the unsent text in the input field, and re-enable the send button so the user can retry by pressing send again.
6. WHEN the message input is empty or contains only whitespace characters, THE Chat_System SHALL disable the send button.
7. IF the user attempts to type beyond 10,000 characters, THEN THE Chat_System SHALL prevent additional character input and display a character count indicator showing the current length relative to the 10,000-character maximum.

### Requirement 4: Conversation View - Polling Sync

**User Story:** As a user, I want to see new messages from the other participant without refreshing, so that the conversation feels responsive.

#### Acceptance Criteria

1. WHILE the Conversation_View is active and the browser tab is visible, THE Chat_System SHALL poll for new messages every 5 seconds by calling `GET /api/chat/rooms/{room_id}/messages/?after_id={uuid}` with the `after_id` parameter set to the UUID of the most recently received message; IF no messages have been loaded yet, THEN the first poll SHALL omit the `after_id` parameter to retrieve the initial message page.
2. WHEN the polling response contains new messages, THE Chat_System SHALL append them to the conversation display ordered by `timestamp` ascending with the message `id` (UUID) as a tie-breaker for identical timestamps.
3. THE Chat_System SHALL deduplicate messages by UUID to prevent displaying the same message more than once.
4. WHEN the Conversation_View unmounts or the user navigates away, THE Chat_System SHALL stop the polling interval and cancel any in-flight poll request.
5. IF a poll request fails due to a network error or a non-401 server error, THEN THE Chat_System SHALL silently skip that cycle and retry on the next 5-second interval without clearing already-displayed messages.
6. IF a poll request returns a 401 response, THEN THE Chat_System SHALL stop the polling interval and redirect the user through the authentication flow.
7. WHEN the browser tab transitions from hidden to visible, THE Chat_System SHALL immediately execute one poll and then resume the 5-second polling interval.

### Requirement 5: Conversation View - Header and Navigation

**User Story:** As a user, I want to see who I am chatting with and easily return to previous screens, so that I have clear navigation context.

#### Acceptance Criteria

1. THE Chat_System SHALL display a header in the Conversation_View showing the other participant's username.
2. THE Chat_System SHALL display a back button (chevron-left icon) positioned at the leading edge of the Conversation_View header.
3. WHEN the user taps the back button, THE Chat_System SHALL navigate back to the previous screen in the navigation history; IF no navigation history exists, THEN THE Chat_System SHALL navigate to the chat rooms list at `/messages`.
4. IF the other participant's account has been deleted or anonymized, THEN THE Chat_System SHALL display the anonymized username provided by the API in place of the original participant identity.
5. WHILE the room participant data is loading, THE Chat_System SHALL display a loading placeholder in the header area until the participant's name is resolved.

### Requirement 6: Contract Message Cards

**User Story:** As a user, I want to see contract proposals displayed as styled cards within the chat, so that I can distinguish them from regular messages.

#### Acceptance Criteria

1. WHEN a Message has a non-null `contract` field, THE Chat_System SHALL render that Message as a Contract_Card instead of a regular text bubble, displaying contract details including price and status.
2. WHEN the Current_User is the client (the user whose UUID matches the ChatRoom's `client_user` field), THE Chat_System SHALL display the Contract_Card aligned to the left of the conversation with contract price, status badge, and an action area (non-functional for now).
3. WHEN the Current_User is the Gig_Owner and has sent a contract message, THE Chat_System SHALL display the text "Contrato enviado" styled in brand-red color, aligned to the right as a sent message.
4. WHILE the Current_User is the Gig_Owner viewing a conversation, THE Chat_System SHALL display a visible "Send Contract" button in the message input area as a non-functional placeholder that does not submit any request when pressed.
5. IF the contract retrieve API request (`GET /api/contracts/retrieve/{contract_id}/`) returns a non-200 response or a network error, THEN THE Chat_System SHALL render the Contract_Card with a fallback layout displaying a message indicating contract details are unavailable, while still showing the message timestamp.

### Requirement 7: Chat List View

**User Story:** As a user, I want to see all my conversations in one place, so that I can easily find and resume chats.

#### Acceptance Criteria

1. WHEN the user navigates to `/messages`, THE Chat_System SHALL call `GET /api/chat/rooms/` with the authenticated user's token and render the first page of results (up to 20 rooms) as a vertically scrollable list ordered by the API response order.
2. THE Chat_System SHALL display each Chat_Room entry showing: the other participant's username (derived from `participant_names` excluding the current user), the `last_message` content preview truncated to a single line (maximum 80 characters with ellipsis if longer), and the room's `created_at` timestamp formatted as a relative time for messages within the last 24 hours or as a short date for older messages.
3. IF a Chat_Room's `last_message` field is `null`, THEN THE Chat_System SHALL display a placeholder text indicating no messages have been sent yet in place of the message preview.
4. WHEN the user taps a Chat_Room entry, THE Chat_System SHALL navigate to `/messages/:roomId` where `:roomId` is the `id` (UUID) of the selected room.
5. WHEN the rooms API response returns `count: 0` and an empty `results` array, THE Chat_System SHALL display an empty state with a friendly illustration and text indicating no conversations exist.
6. WHILE the rooms list has a non-null `next` URL in the pagination response, WHEN the user scrolls within 200px of the bottom of the list, THE Chat_System SHALL fetch the next page using the server-provided `next` URL, append results below existing items without removing previously loaded rooms, and prevent duplicate concurrent requests to the same page.
7. WHILE the initial room list is being fetched, THE Chat_System SHALL display a loading indicator in the list area; WHILE additional pages are loading, THE Chat_System SHALL display a loading indicator at the bottom of the existing list without replacing already-visible rooms.
8. IF the rooms API returns a `401` status, THEN THE Chat_System SHALL redirect the user to the login flow; IF the API returns any other error status (4xx or 5xx), THEN THE Chat_System SHALL display an error state with a message indicating the conversations could not be loaded and a retry action that re-fetches the room list.

### Requirement 8: Bottom Navigation Integration

**User Story:** As a user, I want to access my messages from the main navigation, so that I can quickly check my conversations.

#### Acceptance Criteria

1. WHEN the user taps the "Mensajes" tab in the Bottom_Navigation, THE Chat_System SHALL navigate to the Chat_List_View at `/messages`.
2. WHILE the user is on a route matching `/messages` or any sub-route starting with `/messages/`, THE Chat_System SHALL indicate the "Mensajes" tab as active by applying the brand-600 color, semibold label weight, and setting `aria-current="page"` on the tab element.
3. WHEN the user navigates to a conversation at `/messages/:roomId` and then taps the "Mensajes" tab, THE Chat_System SHALL navigate back to the Chat_List_View at `/messages`.

### Requirement 9: Route Registration

**User Story:** As a developer, I want the chat routes properly registered in the app router, so that navigation works correctly.

#### Acceptance Criteria

1. THE Chat_System SHALL register a route at `/messages` that renders the Chat_List_View wrapped with RequireAuth and RequireOnboarding guards and PageTransition animation, following the same nesting order used by existing protected routes (RequireAuth → RequireOnboarding → PageTransition → Component).
2. THE Chat_System SHALL register a route at `/messages/:roomId` that renders the Conversation_View wrapped with RequireAuth and RequireOnboarding guards and PageTransition animation, following the same nesting order used by existing protected routes.
3. IF a user navigates to `/messages` or `/messages/:roomId` without a valid authentication token, THEN THE Chat_System SHALL redirect the user to the splash route (`/`).
4. IF an authenticated user navigates to `/messages` or `/messages/:roomId` and has not completed onboarding, THEN THE Chat_System SHALL redirect the user to `/complete-profile`.
5. WHILE the user is on a route matching `/messages` (list view), THE Chat_System SHALL display the Bottom_Navigation bar. WHILE the user is on `/messages/:roomId` (conversation view), THE Chat_System SHALL hide the Bottom_Navigation bar by including the path pattern in the NO_NAV_ROUTES exclusion list.
