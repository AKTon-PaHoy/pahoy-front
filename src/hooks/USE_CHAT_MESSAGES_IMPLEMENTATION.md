# useChatMessages Hook Implementation

## Overview

`useChatMessages` is a React hook for managing chat message state, polling, and sending messages for a specific chat room.

## File Location

- **Hook:** `src/hooks/use-chat-messages.ts`
- **Tests:** `src/utils/__tests__/chat-utilities.test.ts` (utility functions)

## Features

### 1. Initial Message Fetching
- Fetches messages from `GET /api/chat/rooms/{roomId}/messages/`
- Reverses API response (newest-first) to chronological order (oldest-first)
- Stores messages in internal `Map<string, Message>` for O(1) deduplication

### 2. Message Sorting & Deduplication
- Exposes sorted message array (timestamp ascending, UUID tie-breaker)
- Uses `sortMessages()` utility for consistent ordering
- Deduplicates by UUID across pagination boundaries

### 3. Polling for New Messages
- Polls every 5 seconds using `GET /api/chat/rooms/{roomId}/messages/?after_id={lastMessageId}`
- Uses `after_id` parameter to fetch only new messages
- Pauses polling when browser tab is hidden (`document.hidden`)
- Resumes with immediate poll when tab becomes visible
- Silently skips failed polls (non-401 errors)
- Stops polling on 401 unauthorized (handled by api() utility)

### 4. Loading Older Messages
- `loadOlderMessages()` fetches next page using pagination URL
- Prepends older messages to conversation
- Maintains deduplication

### 5. Sending Messages
- `sendMessage(content, attachment?)` sends text or file messages
- Validates content with `isValidMessageContent()` utility
- Trims whitespace
- Uses `apiMultipart()` for file uploads, `api()` for text-only
- Disables send button while request is in-flight

### 6. Lifecycle Management
- Cancels in-flight requests on unmount via `AbortController`
- Clears polling intervals on unmount
- Properly cleans up event listeners

## Return Interface

```typescript
interface UseChatMessagesReturn {
  messages: Message[];                           // Sorted array of messages
  isLoading: boolean;                            // Initial load in progress
  isLoadingOlder: boolean;                       // Loading older messages
  error: string | null;                          // Initial/poll error
  hasOlderMessages: boolean;                     // More pages available
  loadOlderMessages: () => void;                 // Fetch older messages
  sendMessage: (content: string, attachment?: File) => Promise<boolean>;
  isSending: boolean;                            // Send request in progress
  sendError: string | null;                      // Send error
}
```

## Usage Example

```typescript
import { useChatMessages } from "@/hooks/use-chat-messages";

function ChatConversation() {
  const roomId = useParams().roomId;
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    isSending,
    loadOlderMessages,
    hasOlderMessages,
  } = useChatMessages(roomId);

  return (
    <div>
      {isLoading && <Spinner />}
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {hasOlderMessages && (
        <Button onClick={loadOlderMessages}>Load older</Button>
      )}
      <ChatInput
        onSend={(content, attachment) => sendMessage(content, attachment)}
        isSending={isSending}
      />
    </div>
  );
}
```

## Utility Functions

The following utilities are exported from `src/utils/chat.ts` and tested:

- **`sortMessages(messages)`** — Sort by timestamp (ascending), UUID tie-breaker
- **`deduplicateMessages(existing, incoming)`** — Merge and deduplicate by UUID
- **`isValidMessageContent(content)`** — Validate: 1-10,000 characters
- **`formatMessageTimestamp(isoTimestamp)`** — Format as relative time or "DD/MM/YYYY HH:mm"
- **`truncatePreview(text, maxLength)`** — Truncate to 80 chars with "…"
- **`resolveOtherParticipant(room, currentUserId)`** — Get other participant's name

## Testing

- **Utility functions:** 27 passing tests in `src/utils/__tests__/chat-utilities.test.ts`
- **Hook:** Integration tests should be added in a consuming component test suite
- All tests use Vitest with `fast-check` for property-based testing

## Requirements Met

✅ Requirement 2.1 — Fetch initial messages, reverse for chronological order  
✅ Requirement 2.6 — Support pagination with infinite scroll  
✅ Requirement 2.9 — Deduplicate messages by UUID  
✅ Requirement 3.2 — Send messages with content validation  
✅ Requirement 4.1 — Polling every 5 seconds  
✅ Requirement 4.4 — Cancel requests on unmount  
✅ Requirement 4.7 — Resume polling on visibility change  

## Error Handling

| Error | Behavior |
|-------|----------|
| 401 Unauthorized | Redirected by `api()` utility |
| 404 Not Found (initial) | Display "La conversación no está disponible" |
| 500/5xx (initial) | Display "Error al cargar los mensajes" |
| 500/5xx (polling) | Silent skip, retry next cycle |
| Network error (initial) | Display "Error de conexión" |
| Network error (polling) | Silent skip, retry next cycle |
| Send failure | Display "Error al enviar el mensaje. Intenta de nuevo." |
