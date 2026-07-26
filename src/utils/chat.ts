import type { ChatRoom, Message } from "@/types/chat";

/**
 * Sorts messages by timestamp in ascending order (oldest first).
 * When timestamps are equal, uses UUID string comparison as tie-breaker.
 *
 * @param messages - Array of messages to sort
 * @returns Sorted array
 */
export function sortMessages(messages: Message[]): Message[] {
  return [...messages].sort((a, b) => {
    const timeCompare = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    if (timeCompare !== 0) return timeCompare;
    // Tie-breaker: UUID string comparison
    return a.id.localeCompare(b.id);
  });
}

/**
 * Deduplicates and merges two arrays of messages by UUID.
 * Returns unique sorted result (oldest first).
 *
 * @param existing - Existing messages array
 * @param incoming - Incoming messages array
 * @returns Deduplicated and sorted array
 */
export function deduplicateMessages(existing: Message[], incoming: Message[]): Message[] {
  const messagesById = new Map<string, Message>();

  // Add existing messages
  existing.forEach((msg) => messagesById.set(msg.id, msg));

  // Add incoming messages (overwrites duplicates)
  incoming.forEach((msg) => messagesById.set(msg.id, msg));

  // Convert back to array and sort
  const merged = Array.from(messagesById.values());
  return sortMessages(merged);
}

/**
 * Validates message content.
 * Valid if: contains at least 1 non-whitespace character AND ≤ 10,000 characters.
 *
 * @param content - Message content to validate
 * @returns true if valid, false otherwise
 */
export function isValidMessageContent(content: string): boolean {
  // Must have at least 1 non-whitespace character
  if (!content.trim()) return false;
  // Must not exceed 10,000 characters
  if (content.length > 10000) return false;
  return true;
}

/**
 * Formats an ISO timestamp as:
 * - Relative time (e.g., "hace 5 min", "hace 2 horas") if < 24 hours old
 * - Absolute format "DD/MM/YYYY HH:mm" if >= 24 hours old
 *
 * @param isoTimestamp - ISO datetime string
 * @returns Formatted timestamp string
 */
export function formatMessageTimestamp(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  // Less than 1 minute ago
  if (diffMinutes < 1) {
    return "Ahora";
  }

  // Less than 60 minutes
  if (diffMinutes < 60) {
    return diffMinutes === 1 ? "Hace 1 min" : `Hace ${diffMinutes} min`;
  }

  // Less than 24 hours
  if (diffHours < 24) {
    return diffHours === 1 ? "Hace 1 hora" : `Hace ${diffHours} horas`;
  }

  // 24+ hours: use absolute format "DD/MM/YYYY HH:mm"
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Truncates text to maxLength (default 80) chars with "…" if truncated.
 * If text is shorter than maxLength, returns as-is.
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length (default: 80)
 * @returns Truncated text
 */
export function truncatePreview(text: string, maxLength: number = 80): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "…";
}

/**
 * Resolves the other participant's name from a chat room.
 * Finds the participant name that doesn't correspond to the current user.
 *
 * @param room - Chat room object
 * @param currentUserId - Current user's UUID
 * @returns Other participant's name
 */
export function resolveOtherParticipant(room: ChatRoom, currentUserId: string): string {
  const currentUserIndex = room.participants.indexOf(currentUserId);

  // If current user not found, try to return first name
  if (currentUserIndex === -1) {
    return room.participant_names[0] || "Unknown";
  }

  // Return the name of the other participant
  const otherIndex = currentUserIndex === 0 ? 1 : 0;
  return room.participant_names[otherIndex] || "Unknown";
}
