import { useCallback, useEffect, useRef, useState } from "react";
import { api, apiMultipart, ApiError } from "@/utils/api";
import { Message, PaginatedResponse } from "@/types/chat";
import { isValidMessageContent, sortMessages } from "@/utils/chat";

export interface UseChatMessagesReturn {
  messages: Message[];
  isLoading: boolean;
  isLoadingOlder: boolean;
  error: string | null;
  hasOlderMessages: boolean;
  loadOlderMessages: () => void;
  sendMessage: (content: string, attachment?: File) => Promise<boolean>;
  isSending: boolean;
  sendError: string | null;
}

/**
 * Custom hook to fetch, manage, and sync chat messages for a specific room.
 *
 * Fetches initial messages from GET /api/chat/rooms/{roomId}/messages/ on mount.
 * Maintains internal Map<string, Message> for O(1) deduplication.
 * Exposes sorted message array (timestamp ascending, UUID tie-breaker).
 *
 * Implements 5-second polling with after_id parameter:
 * - Pauses polling when tab is hidden (document.hidden)
 * - Resumes with immediate poll on visibility change
 *
 * Cancels in-flight requests on unmount via AbortController.
 *
 * loadOlderMessages() fetches next page and prepends.
 * sendMessage(content, attachment?) uses apiMultipart when attachment present, api otherwise.
 *
 * Returns:
 * - messages: sorted array of messages
 * - isLoading: true while initial load is in progress
 * - isLoadingOlder: true while fetching older messages
 * - error: null or error message for initial/poll failures
 * - hasOlderMessages: true if more pages available
 * - loadOlderMessages: function to fetch older messages
 * - sendMessage: async function to send a message, returns true on success
 * - isSending: true while send request is in progress
 * - sendError: null or error message for send failures
 */
export function useChatMessages(roomId: string): UseChatMessagesReturn {
  // Internal state: Map for O(1) deduplication
  const messagesById = useRef<Map<string, Message>>(new Map());
  const sortedIds = useRef<string[]>([]);
  const nextPageUrl = useRef<string | null>(null);

  // UI state
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Polling and lifecycle management
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollAbortControllerRef = useRef<AbortController | null>(null);
  const loadOlderAbortControllerRef = useRef<AbortController | null>(null);
  const sendAbortControllerRef = useRef<AbortController | null>(null);

  // Expose sorted messages
  const getSortedMessages = useCallback(() => {
    const messageArray = Array.from(messagesById.current.values());
    return sortMessages(messageArray);
  }, []);

  // Helper to update UI state from internal map
  const updateMessagesUI = useCallback(() => {
    setMessages(getSortedMessages());
  }, [getSortedMessages]);

  // Fetch initial messages
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchInitial = async () => {
      try {
        setError(null);
        setIsLoading(true);

        const response = await api<PaginatedResponse<Message>>(
          `/api/chat/rooms/${roomId}/messages/`,
        );

        if (isMounted && !controller.signal.aborted) {
          // Reverse API response (newest-first) to chronological order (oldest-first)
          const reversed = response.results.reverse();

          // Store in deduplication map
          reversed.forEach((msg) => {
            messagesById.current.set(msg.id, msg);
          });

          sortedIds.current = Array.from(messagesById.current.keys());
          nextPageUrl.current = response.next;

          updateMessagesUI();
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted && !controller.signal.aborted) {
          if (err instanceof ApiError) {
            if (err.status === 401) {
              // 401 is handled by api() utility and redirects automatically
              return;
            }
            if (err.status === 404) {
              setError("La conversación no está disponible");
              setIsLoading(false);
              return;
            }
            setError("Error al cargar los mensajes");
          } else {
            setError("Error de conexión");
          }
          setIsLoading(false);
        }
      }
    };

    fetchInitial();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [roomId, updateMessagesUI]);

  // Polling mechanism
  useEffect(() => {
    let isMounted = true;

    const poll = async () => {
      // Don't poll if tab is hidden or if already in a poll
      if (document.hidden || pollAbortControllerRef.current?.signal.aborted === false) {
        return;
      }

      pollAbortControllerRef.current = new AbortController();

      try {
        // Build poll URL with after_id if we have messages
        let pollUrl = `/api/chat/rooms/${roomId}/messages/`;
        if (sortedIds.current.length > 0) {
          // Get the last message UUID
          const lastId = sortedIds.current[sortedIds.current.length - 1];
          pollUrl += `?after_id=${lastId}`;
        }

        const response = await api<PaginatedResponse<Message>>(pollUrl);

        if (isMounted && !pollAbortControllerRef.current?.signal.aborted) {
          // Reverse API response for chronological order
          const reversed = response.results.reverse();

          // Add new messages to map (deduplicate by UUID)
          reversed.forEach((msg) => {
            messagesById.current.set(msg.id, msg);
          });

          sortedIds.current = Array.from(messagesById.current.keys());
          updateMessagesUI();
        }
      } catch (err) {
        // Silent failure for polls (non-401 errors)
        if (err instanceof ApiError && err.status === 401) {
          // 401 is handled by api() utility and redirects automatically
          if (isMounted) {
            // Stop polling on 401
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
          }
        }
        // Other errors: silently skip this cycle, retry next interval
      }
    };

    // Start polling interval
    const startPolling = () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

      // First poll immediately (but only if we're not in initial load)
      if (!isLoading) {
        poll();
      }

      // Then set up 5-second interval
      pollIntervalRef.current = setInterval(() => {
        if (!document.hidden) {
          poll();
        }
      }, 5000);
    };

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab became visible: immediate poll + resume interval
        poll();
        startPolling();
      } else {
        // Tab became hidden: pause polling
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }
    };

    // Start polling once initial load completes
    if (!isLoading) {
      startPolling();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (pollAbortControllerRef.current) {
        pollAbortControllerRef.current.abort();
      }
    };
  }, [roomId, isLoading, updateMessagesUI]);

  // Load older messages (prepend)
  const loadOlderMessages = useCallback(() => {
    if (isLoadingOlder || !nextPageUrl.current) return;

    let isMounted = true;
    loadOlderAbortControllerRef.current = new AbortController();

    const fetchOlder = async () => {
      try {
        setIsLoadingOlder(true);
        setError(null);

        // Extract path from full next URL
        const url = new URL(nextPageUrl.current!);
        const path = url.pathname + url.search;

        const response = await api<PaginatedResponse<Message>>(path);

        if (isMounted && !loadOlderAbortControllerRef.current?.signal.aborted) {
          // Reverse API response for chronological order
          const reversed = response.results.reverse();

          // Add to deduplication map (overwrites duplicates)
          reversed.forEach((msg) => {
            messagesById.current.set(msg.id, msg);
          });

          sortedIds.current = Array.from(messagesById.current.keys());
          nextPageUrl.current = response.next;

          updateMessagesUI();
          setIsLoadingOlder(false);
        }
      } catch (err) {
        if (isMounted && !loadOlderAbortControllerRef.current?.signal.aborted) {
          if (err instanceof ApiError && err.status !== 401) {
            setError("Error al cargar más mensajes");
          }
          setIsLoadingOlder(false);
        }
      }
    };

    fetchOlder();
  }, [updateMessagesUI]);

  // Send message
  const sendMessage = useCallback(
    async (content: string, attachment?: File): Promise<boolean> => {
      const trimmed = content.trim();

      // Validate content
      if (!isValidMessageContent(trimmed)) {
        setSendError("El mensaje debe tener al menos 1 carácter");
        return false;
      }

      let isMounted = true;
      sendAbortControllerRef.current = new AbortController();

      try {
        setIsSending(true);
        setSendError(null);

        let response: Message;

        if (attachment) {
          // Use multipart for file upload
          const formData = new FormData();
          formData.append("room", roomId);
          formData.append("content", trimmed);
          formData.append("attachment", attachment);

          response = await apiMultipart<Message>(
            `/api/chat/rooms/${roomId}/messages/`,
            { method: "POST", body: formData },
          );
        } else {
          // Use JSON for text-only
          response = await api<Message>(`/api/chat/rooms/${roomId}/messages/`, {
            method: "POST",
            body: {
              room: roomId,
              content: trimmed,
            },
          });
        }

        if (isMounted && !sendAbortControllerRef.current?.signal.aborted) {
          // Add message to map
          messagesById.current.set(response.id, response);
          sortedIds.current = Array.from(messagesById.current.keys());

          updateMessagesUI();
          setIsSending(false);
          setSendError(null);
          return true;
        }

        return false;
      } catch (err) {
        if (isMounted && !sendAbortControllerRef.current?.signal.aborted) {
          if (err instanceof ApiError && err.status !== 401) {
            setSendError("Error al enviar el mensaje. Intenta de nuevo.");
          } else {
            setSendError("Error de conexión");
          }
          setIsSending(false);
          return false;
        }

        return false;
      }
    },
    [roomId, updateMessagesUI],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (pollAbortControllerRef.current) {
        pollAbortControllerRef.current.abort();
      }
      if (loadOlderAbortControllerRef.current) {
        loadOlderAbortControllerRef.current.abort();
      }
      if (sendAbortControllerRef.current) {
        sendAbortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    messages,
    isLoading,
    isLoadingOlder,
    error,
    hasOlderMessages: nextPageUrl.current !== null,
    loadOlderMessages,
    sendMessage,
    isSending,
    sendError,
  };
}
