import { formatMessageTimestamp, truncatePreview } from "@/utils/chat";

export interface RoomItemProps {
  otherParticipantName: string;
  lastMessage: string | null;
  createdAt: string;
  onClick: () => void;
}

/**
 * RoomItem Component
 *
 * Displays a chat room entry in the chat list view with participant name,
 * truncated message preview, and formatted timestamp.
 *
 * **Validates: Requirements 7.2, 7.3, 7.4**
 *
 * @example
 * ```tsx
 * <RoomItem
 *   otherParticipantName="Juan"
 *   lastMessage="¿Cuándo puedes empezar con el trabajo?"
 *   createdAt="2025-01-15T14:30:00Z"
 *   onClick={() => navigate(`/messages/${roomId}`)}
 * />
 * ```
 */
export function RoomItem({
  otherParticipantName,
  lastMessage,
  createdAt,
  onClick,
}: RoomItemProps) {
  const formattedTimestamp = formatMessageTimestamp(createdAt);
  const displayMessage = lastMessage
    ? truncatePreview(lastMessage, 80)
    : "Sin mensajes aún";

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-2 border-b border-neutral-200 px-4 py-3 text-left transition-colors active:bg-neutral-50"
    >
      {/* Top row: participant name and timestamp */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-primary">
          {otherParticipantName}
        </h3>
        <span className="text-xs text-tertiary">{formattedTimestamp}</span>
      </div>

      {/* Message preview */}
      <p className="line-clamp-1 text-sm text-tertiary">{displayMessage}</p>
    </button>
  );
}
