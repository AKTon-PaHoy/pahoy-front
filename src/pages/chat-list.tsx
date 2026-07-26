import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ChevronLeft } from "@untitledui/icons";
import { useChatRooms } from "@/hooks/use-chat-rooms";
import { useCurrentUser } from "@/hooks/use-current-user";
import { RoomItem } from "@/components/application/chat/room-item";
import { LoadingIndicator } from "@/components/application/loading-indicator/loading-indicator";
import { Button } from "@/components/base/buttons/button";
import { resolveOtherParticipant } from "@/utils/chat";
import { api } from "@/utils/api";
import type { Gig } from "@/types/gig";

/**
 * ChatList page component
 *
 * Displays all chat rooms for the authenticated user.
 * - Fetches rooms via useChatRooms hook
 * - Resolves other participant names using useCurrentUser
 * - Fetches and caches gig names for each room
 * - Supports infinite scroll for pagination (200px threshold)
 * - Shows loading, empty, and error states
 * - Each room navigates to the conversation view
 *
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8
 */
export function ChatList() {
  const navigate = useNavigate();

  // Fetch rooms with pagination
  const {
    rooms,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    retry,
  } = useChatRooms();

  // Get current user for participant resolution
  const { user: currentUser } = useCurrentUser();

  // Cache gig names to avoid multiple fetches
  const [gigNames, setGigNames] = useState<Record<string, string>>({});

  // Scroll management for infinite scroll
  const roomsContainerRef = useRef<HTMLDivElement>(null);

  // Fetch gig details for rooms
  useEffect(() => {
    const fetchGigNames = async () => {
      const gigIdsToFetch = rooms
        .filter((room) => room.gig && !gigNames[room.gig])
        .map((room) => room.gig);

      if (gigIdsToFetch.length === 0) return;

      // Fetch gig details for each missing gig ID
      const newGigNames: Record<string, string> = {};
      for (const gigId of gigIdsToFetch) {
        try {
          const gig = await api<Gig>(`/api/gigs/retrieve/${gigId}/`);
          newGigNames[gigId] = gig.name;
        } catch {
          // If gig fetch fails, we'll show "Cargando..." gracefully
          newGigNames[gigId] = "Cargando...";
        }
      }

      setGigNames((prev) => ({ ...prev, ...newGigNames }));
    };

    if (rooms.length > 0) {
      fetchGigNames();
    }
  }, [rooms, gigNames]);

  // Detect infinite scroll downward
  useEffect(() => {
    const container = roomsContainerRef.current;
    if (!container || !hasMore || isLoadingMore) return;

    const handleScroll = () => {
      // Check if user scrolled within 200px of bottom
      if (
        container.scrollHeight - container.scrollTop - container.clientHeight <
        200
      ) {
        loadMore();
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasMore, isLoadingMore, loadMore]);

  const handleRoomClick = (roomId: string) => {
    navigate(`/messages/${roomId}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="min-h-dvh flex flex-col bg-white"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
        {/* Back button */}
        <button
          onClick={() => navigate("/home")}
          className="size-10 rounded-lg text-neutral-500 hover:bg-neutral-50 flex items-center justify-center"
          aria-label="Volver atrás"
        >
          <ChevronLeft className="size-6" />
        </button>

        {/* Title */}
        <h1 className="text-center text-base font-semibold text-primary flex-1">
          Mensajes
        </h1>

        {/* Spacer to balance layout */}
        <div className="size-10" />
      </div>

      {/* Rooms container */}
      <div
        ref={roomsContainerRef}
        className="flex-1 overflow-y-auto"
      >
        {/* Loading state - initial load */}
        {isLoading && (
          <div className="flex h-full items-center justify-center">
            <LoadingIndicator size="lg" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && rooms.length === 0 && !error && (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
            <p className="text-tertiary">No tienes conversaciones</p>
            <p className="text-xs text-tertiary">
              Comienza a chatear con un talento desde una chamba
            </p>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-4 text-center">
            <p className="text-error-primary">{error}</p>
            <Button
              type="button"
              color="primary"
              size="md"
              onClick={retry}
            >
              Reintentar
            </Button>
          </div>
        )}

        {/* Rooms list */}
        {!isLoading && rooms.length > 0 && (
          <div className="divide-y divide-neutral-200">
            {rooms.map((room) => {
              const otherParticipantName = currentUser
                ? resolveOtherParticipant(room, currentUser.id)
                : "Usuario";

              const gigName = room.gig ? gigNames[room.gig] : undefined;

              return (
                <RoomItem
                  key={room.id}
                  otherParticipantName={otherParticipantName}
                  lastMessage={room.last_message}
                  createdAt={room.created_at}
                  gigName={gigName}
                  onClick={() => handleRoomClick(room.id)}
                />
              );
            })}
          </div>
        )}

        {/* Loading indicator for more pages */}
        {isLoadingMore && (
          <div className="flex justify-center border-t border-neutral-200 py-4">
            <LoadingIndicator size="sm" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

ChatList.displayName = "ChatList";
