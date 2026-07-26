import { useEffect, useRef, useCallback, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ChevronLeft } from "@untitledui/icons";
import { useChatMessages } from "@/hooks/use-chat-messages";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useChatRooms } from "@/hooks/use-chat-rooms";
import { MessageBubble } from "@/components/application/chat/message-bubble";
import { ContractCard } from "@/components/application/chat/contract-card";
import { ChatInput } from "@/components/application/chat/chat-input";
import { LoadingIndicator } from "@/components/application/loading-indicator/loading-indicator";
import { api, ApiError } from "@/utils/api";
import { cx } from "@/utils/cx";

/**
 * ChatConversation page component
 *
 * Displays the message thread for a specific chat room.
 */

interface Gig {
  id: string;
  name: string;
  talent: string;
  price: number;
  price_type: string;
  description: string;
}

export function ChatConversation() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  // State for gig details
  const [gig, setGig] = useState<Gig | null>(null);
  const [isLoadingGig, setIsLoadingGig] = useState(false);

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

  // Fetch gig details when room is loaded
  useEffect(() => {
    if (!currentRoom?.gig) return;

    let isMounted = true;

    const fetchGig = async () => {
      try {
        setIsLoadingGig(true);
        const response = await api<Gig>(
          `/api/gigs/retrieve/${currentRoom.gig}/`,
        );
        if (isMounted) {
          setGig(response);
        }
      } catch (err) {
        if (isMounted) {
          if (!(err instanceof ApiError && err.status === 401)) {
            console.error("Error fetching gig details:", err);
          }
        }
      } finally {
        if (isMounted) {
          setIsLoadingGig(false);
        }
      }
    };

    fetchGig();

    return () => {
      isMounted = false;
    };
  }, [currentRoom?.gig]);

  // Determine if current user is the gig owner (NOT the client_user)
  const isGigOwner =
    currentUser && currentRoom
      ? currentUser.id !== currentRoom.client_user
      : false;

  // Determine if current user is the client
  const isClient =
    currentUser && currentRoom
      ? currentUser.id === currentRoom.client_user
      : false;

  // Get other participant's name from room
  const otherParticipantName =
    currentRoom && currentUser
      ? currentRoom.participant_names[
          currentRoom.participants.indexOf(currentUser.id) === 0 ? 1 : 0
        ]
      : currentRoom
        ? currentRoom.participant_names[0] || "Usuario"
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

    const timeoutId = setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [messages.length, isLoading]);

  const handleSendMessage = useCallback(
    async (content: string, attachment?: File) => {
      return sendMessage(content, attachment);
    },
    [sendMessage],
  );

  /**
   * Determines if a message was sent by the current user.
   * Uses sender UUID comparison with currentUser.id as primary check.
   * Falls back to checking if sender matches one of the room participants.
   */
  const checkIsOwnMessage = (senderUuid: string): boolean => {
    if (currentUser) {
      return senderUuid === currentUser.id;
    }
    // Fallback: if currentUser isn't loaded but we have room data,
    // check if sender is NOT the other participant (assumes 2 participants)
    if (currentRoom) {
      // client_user is one participant, the other is the talent/gig owner
      // If sender is client_user, and we ARE the client, it's own
      // We can't determine this without currentUser, so default to false
      return false;
    }
    return false;
  };

  return (
    <div className="flex h-dvh flex-col bg-white">
      {/* Header - fixed at top */}
      <div className="shrink-0 flex items-center justify-between border-b border-neutral-200 px-4 py-3">
        <button
          onClick={handleBack}
          className="flex size-10 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-50"
          aria-label="Volver atrás"
        >
          <ChevronLeft className="size-6" />
        </button>

        <div className="flex-1 text-center">
          <h1 className="text-base font-semibold text-primary">
            {isLoadingUser ? "Cargando..." : otherParticipantName}
          </h1>
          {gig && (
            <p className="mt-0.5 text-xs text-tertiary">Gig: {gig.name}</p>
          )}
          {isLoadingGig && !gig && (
            <p className="mt-0.5 text-xs text-tertiary">Cargando gig...</p>
          )}
        </div>

        {/* Spacer to balance layout */}
        <div className="size-10" />
      </div>

      {/* Messages container - scrollable area between header and input */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{ minHeight: 0 }}
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
              const isOwnMessage = checkIsOwnMessage(message.sender);

              return (
                <div
                  key={message.id}
                  className={cx(
                    "flex",
                    isOwnMessage ? "justify-end" : "justify-start",
                  )}
                >
                  {message.contract ? (
                    <ContractCard
                      contractId={message.contract}
                      isOwnMessage={isOwnMessage}
                      isClient={isClient}
                      timestamp={message.timestamp}
                    />
                  ) : (
                    <MessageBubble
                      content={message.content}
                      senderUsername={message.sender_username}
                      timestamp={message.timestamp}
                      isOwnMessage={isOwnMessage}
                      attachment={message.attachment}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Chat input - fixed at bottom */}
      <div className="shrink-0">
        <ChatInput
          onSend={handleSendMessage}
          isSending={isSending}
          sendError={sendError}
          isGigOwner={isGigOwner}
        />
      </div>
    </div>
  );
}

ChatConversation.displayName = "ChatConversation";
