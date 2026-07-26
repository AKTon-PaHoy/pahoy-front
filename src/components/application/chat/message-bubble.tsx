import type { ComponentPropsWithRef } from "react";
import { formatMessageTimestamp } from "@/utils/chat";
import { cx } from "@/utils/cx";

export interface MessageBubbleProps extends ComponentPropsWithRef<"div"> {
  content: string;
  senderUsername: string;
  timestamp: string; // ISO string
  isOwnMessage: boolean; // determines alignment and color
  attachment?: string | null;
}

/**
 * MessageBubble component displays a single chat message.
 *
 * - Own messages (isOwnMessage=true): right-aligned with brand color background
 * - Other messages (isOwnMessage=false): left-aligned with neutral color background
 * - Shows sender username and formatted timestamp
 * - Renders attachment as clickable link/image when present
 *
 * Validates: Requirements 2.2, 2.3, 2.4
 */
export function MessageBubble({
  content,
  senderUsername,
  timestamp,
  isOwnMessage,
  attachment,
  className,
  ...props
}: MessageBubbleProps) {
  const formattedTimestamp = formatMessageTimestamp(timestamp);

  return (
    <div
      {...props}
      className={cx(
        "flex flex-col gap-1",
        isOwnMessage ? "items-end" : "items-start",
        className
      )}
    >
      {/* Sender username */}
      <span className="text-xs text-tertiary">{senderUsername}</span>

      {/* Message bubble */}
      <div
        className={cx(
          "max-w-xs rounded-lg px-4 py-3 text-sm",
          isOwnMessage
            ? "bg-brand-50 text-brand-700"
            : "bg-neutral-50 text-neutral-700"
        )}
      >
        <p className="break-words">{content}</p>

        {/* Attachment */}
        {attachment && (
          <a
            href={attachment}
            target="_blank"
            rel="noopener noreferrer"
            className={cx(
              "mt-2 inline-block underline",
              isOwnMessage ? "text-brand-600 hover:text-brand-700" : "text-neutral-600 hover:text-neutral-700"
            )}
          >
            {attachment.endsWith(".jpg") ||
            attachment.endsWith(".jpeg") ||
            attachment.endsWith(".png") ||
            attachment.endsWith(".gif") ||
            attachment.endsWith(".webp")
              ? "Ver imagen"
              : "Ver archivo"}
          </a>
        )}
      </div>

      {/* Timestamp */}
      <span className="text-xs text-tertiary">{formattedTimestamp}</span>
    </div>
  );
}
