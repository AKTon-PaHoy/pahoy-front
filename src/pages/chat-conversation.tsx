import { useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import { ChevronLeft } from "@untitledui/icons";
import { useChatMessages } from "@/hooks/use-chat-messages";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useChatRooms } from "@/hooks/use-chat-rooms";
import { MessageBubble } from "@/components/application/chat/message-bubble";
import { ContractCard } from "@/components/application/chat/contract-card";
import { ChatInput } from "@/components/application/chat/chat-input";
import { LoadingIndicator } from "@/components/application/loading-indicator/loading-indicator";
import { cx } from "@/utils/cx";

/**
 * ChatConversation page component
 *
 * Displays the message thread for a specific chat room.
 * - Fetches messages via useChatMessages hook
 * - Determines message alignment and contract rendering based on current user
 * - Supports infinite scroll upward for older messages
 * - Preserves scroll position when prepending messages
 * - Displays header with other participant's name and back button
 * - Shows ChatInput component at bottom
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.4, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4
 */
export function ChatConversation() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  // Fetch messages and handle polling
  const {
    messages,
    isLoading,
    isLoadingOlder,
    error,
    hasOlderMessages,
    loadOlderMessages,
    sendMessage,
    isSending,
    sendError,
  } = useChatMessages(roomId!);

  // Get current user for message alignment
  const { user: currentUser, isLoading: isLoadingUser } = useCurrentUser();

  // Fetch room data to determine isGigOwner and isClient
  const { rooms } = useChatRooms();

  // Scroll management
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(messages.length);
  const prevScrollHeightRef = useRef(0);

  // Find the current room to get room data
  const currentRoom = rooms.find((r) => r.id === roomId);

  // Determine if current user is the gig owner (NOT the client_user)
  const isGigOwner =
    currentUser && currentRoom
      ? currentUser.id !== currentRoom.client_user
      : false;

  // Determine if current user is the client
  const isClient = currentUser && currentRoom ? currentUser.id === currentRoom.client_user : false;

  // Get other participant's name from room
  const otherParticipantName =
    currentRoom && currentUser
      ? currentRoom.participant_names[
          currentRoom.participants.indexOf(currentUser.id) === 0 ? 1 : 0
        ]
      : "Usuario";

  // Handle back navigation
  const handleBack = () => {
    navigate(-1);
  };

  // Detect infinite scroll upward
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || !hasOlderMessages || isLoadingOlder) return;

    const handleScroll = () => {
      if (container.scrollTop < 200) {
        loadOlderMessages();
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasOlderMessages, isLoadingOlder, loadOlderMessages]);

  // Preserve scroll position when prepending older messages
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // When older messages are loaded (prev count < current count),
    // adjust scroll to maintain view position
    if (
      messages.length > prevMessageCountRef.current &&
      prevScrollHeightRef.current > 0
    ) {
      const heightDiff = container.scrollHeight - prevScrollHeightRef.current;
      container.scrollTop += heightDiff;
    }

    prevMessageCountRef.current = messages.length;
    prevScrollHeightRef.current = container.scrollHeight;
  }, [messages.length]);

  // Scroll to bottom when new messages arrive (only after initial load)
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || isLoading) return;

    // Small delay to ensure DOM has updated
    const timeoutId = setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [messages.length, isLoading]);

  const handleSendMessage = useCallback(
    async (content: string, attachment?: File) => {
      return sendMessage(content, attachment);
    },
    [sendMessage]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="min-h-dvh flex flex-col bg-white"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
        <button
          onClick={handleBack}
          className="size-10 rounded-lg text-neutral-500 hover:bg-neutral-50 flex items-center justify-center"
          aria-label="Volver atrás"
        >
          <ChevronLeft className="size-6" />
        </button>

        <h1 className="text-center text-base font-semibold text-primary flex-1">
          {isLoadingUser ? "Cargando..." : otherParticipantName}
        </h1>

        {/* Spacer to balance layout */}
        <div className="size-10" />
      </div>

      {/* Messages container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        {/* Loading indicator for initial load */}
        {isLoading && (
          <div className="flex h-full items-center justify-center">
            <LoadingIndicator size="lg" />
          </div>
        )}

        {/* Loading indicator for older messages */}
        {isLoadingOlder && (
          <div className="mb-4 flex justify-center">
            <LoadingIndicator size="sm" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && messages.length === 0 && !error && (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <p className="text-tertiary">No tienes mensajes</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <p className="text-error-primary">{error}</p>
          </div>
        )}

        {/* Messages list */}
        {!isLoading && messages.length > 0 && (
          <div className="flex flex-col gap-4">
            {messages.map((message) => {
              const isOwnMessage = currentUser && message.sender === currentUser.id;

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cx(
                    "flex",
                    isOwnMessage ? "justify-end" : "justify-start"
                  )}
                >
                  {message.contract ? (
                    <ContractCard
                      contractId={message.contract}
                      isOwnMessage={isOwnMessage || false}
                      isClient={isClient}
                      timestamp={message.timestamp}
                    />
                  ) : (
                    <MessageBubble
                      content={message.content}
                      senderUsername={message.sender_username}
                      timestamp={message.timestamp}
                      isOwnMessage={isOwnMessage || false}
                      attachment={message.attachment}
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Chat input at bottom */}
      <ChatInput
        onSend={handleSendMessage}
        isSending={isSending}
        sendError={sendError}
        isGigOwner={isGigOwner}
      />
    </motion.div>
  );
}

ChatConversation.displayName = "ChatConversation";
