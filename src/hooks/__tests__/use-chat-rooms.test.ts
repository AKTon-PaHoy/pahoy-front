import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { useChatRooms } from "@/hooks/use-chat-rooms";
import * as apiModule from "@/utils/api";

const mockChatRoom = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "Chat with John",
  participants: [
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002",
  ],
  participant_names: ["Alice", "John"],
  last_message: "See you tomorrow!",
  client_user: "550e8400-e29b-41d4-a716-446655440001",
  gig: "550e8400-e29b-41d4-a716-446655440003",
  is_active: true,
  created_at: "2024-01-15T10:30:00Z",
};

const mockPaginatedResponse = {
  count: 2,
  next: "http://localhost:8000/api/chat/rooms/?page=2",
  previous: null,
  results: [mockChatRoom],
};

const mockSecondPage = {
  count: 2,
  next: null,
  previous: "http://localhost:8000/api/chat/rooms/?page=1",
  results: [
    {
      ...mockChatRoom,
      id: "550e8400-e29b-41d4-a716-446655440004",
      name: "Chat with Jane",
      participant_names: ["Alice", "Jane"],
    },
  ],
};

describe("useChatRooms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("successful initial load", () => {
    it("should fetch initial page from GET /api/chat/rooms/ on mount", async () => {
      const apiSpy = vi
        .spyOn(apiModule, "api")
        .mockResolvedValueOnce(mockPaginatedResponse);

      const { result } = renderHook(() => useChatRooms());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(apiSpy).toHaveBeenCalledWith("/api/chat/rooms/");
    });

    it("should populate rooms array with results from API", async () => {
      vi.spyOn(apiModule, "api").mockResolvedValueOnce(mockPaginatedResponse);

      const { result } = renderHook(() => useChatRooms());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.rooms).toEqual([mockChatRoom]);
      expect(result.current.rooms).toHaveLength(1);
    });

    it("should set hasMore to true when next URL exists", async () => {
      vi.spyOn(apiModule, "api").mockResolvedValueOnce(mockPaginatedResponse);

      const { result } = renderHook(() => useChatRooms());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasMore).toBe(true);
    });

    it("should set error to null on successful load", async () => {
      vi.spyOn(apiModule, "api").mockResolvedValueOnce(mockPaginatedResponse);

      const { result } = renderHook(() => useChatRooms());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeNull();
    });

    it("should set isLoading to false when load completes", async () => {
      vi.spyOn(apiModule, "api").mockResolvedValueOnce(mockPaginatedResponse);

      const { result } = renderHook(() => useChatRooms());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("should set isLoadingMore to false initially", async () => {
      vi.spyOn(apiModule, "api").mockResolvedValueOnce(mockPaginatedResponse);

      const { result } = renderHook(() => useChatRooms());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isLoadingMore).toBe(false);
    });
  });

  describe("empty state", () => {
    it("should handle empty results array from API", async () => {
      const emptyResponse = {
        count: 0,
        next: null,
        previous: null,
        results: [],
      };
      vi.spyOn(apiModule, "api").mockResolvedValueOnce(emptyResponse);

      const { result } = renderHook(() => useChatRooms());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.rooms).toEqual([]);
      expect(result.current.hasMore).toBe(false);
    });
  });

  describe("loadMore functionality", () => {
    it("should fetch next page when loadMore is called", async () => {
      let callCount = 0;
      vi.spyOn(apiModule, "api").mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return mockPaginatedResponse;
        }
        return mockSecondPage;
      });

      const { result } = renderHook(() => useChatRooms());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.rooms).toHaveLength(1);

      result.current.loadMore();

      await waitFor(() => {
        expect(result.current.isLoadingMore).toBe(false);
      }, { timeout: 500 });

      expect(result.current.rooms).toHaveLength(2);
    });

    it("should append results from next page without replacing existing rooms", async () => {
      let callCount = 0;
      vi.spyOn(apiModule, "api").mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return mockPaginatedResponse;
        }
        return mockSecondPage;
      });

      const { result } = renderHook(() => useChatRooms());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const firstPageRoom = result.current.rooms[0];

      result.current.loadMore();

      await waitFor(() => {
        expect(result.current.isLoadingMore).toBe(false);
      });

      expect(result.current.rooms[0]).toEqual(firstPageRoom);
      expect(result.current.rooms).toHaveLength(2);
    });

    it("should update hasMore after loading final page", async () => {
      let callCount = 0;
      vi.spyOn(apiModule, "api").mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return mockPaginatedResponse;
        }
        return mockSecondPage;
      });

      const { result } = renderHook(() => useChatRooms());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasMore).toBe(true);

      result.current.loadMore();

      await waitFor(() => {
        expect(result.current.isLoadingMore).toBe(false);
      });

      expect(result.current.hasMore).toBe(false);
    });

    it("should not call loadMore if already loading more", async () => {
      vi.spyOn(apiModule, "api");
      let callCount = 0;
      vi.mocked(apiModule.api).mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return mockPaginatedResponse;
        } else if (callCount === 2) {
          // Slow down the second call to simulate loading
          await new Promise((resolve) => setTimeout(resolve, 200));
          return mockSecondPage;
        }
        return mockSecondPage;
      });

      const { result } = renderHook(() => useChatRooms());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Call loadMore multiple times rapidly - only the first should execute
      result.current.loadMore();

      await new Promise((resolve) => setTimeout(resolve, 50));

      // These should be no-ops because loadMore is already in progress
      result.current.loadMore();
      result.current.loadMore();

      await waitFor(() => {
        expect(result.current.isLoadingMore).toBe(false);
      }, { timeout: 500 });

      // Should only make 2 API calls: initial load + one loadMore
      expect(callCount).toEqual(2);
    });

    it("should not call loadMore if no more pages available", async () => {
      const noNextResponse = {
        count: 1,
        next: null,
        previous: null,
        results: [mockChatRoom],
      };
      const apiSpy = vi
        .spyOn(apiModule, "api")
        .mockResolvedValueOnce(noNextResponse);

      const { result } = renderHook(() => useChatRooms());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.loadMore();

      await waitFor(() => {
        expect(apiSpy).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("retry functionality", () => {
    it("should retry failed initial load", async () => {
      const apiError = new apiModule.ApiError(
        500,
        {},
        "Internal Server Error"
      );
      const apiSpy = vi
        .spyOn(apiModule, "api")
        .mockRejectedValueOnce(apiError)
        .mockResolvedValueOnce(mockPaginatedResponse);

      const { result } = renderHook(() => useChatRooms());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).not.toBeNull();

      result.current.retry();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });

      expect(result.current.rooms).toEqual([mockChatRoom]);
      expect(apiSpy).toHaveBeenCalledTimes(2);
    });

    it("should reset error to null when retrying", async () => {
      vi.spyOn(apiModule, "api")
        .mockRejectedValueOnce(
          new apiModule.ApiError(500, {}, "Internal Server Error")
        )
        .mockResolvedValueOnce(mockPaginatedResponse);

      const { result } = renderHook(() => useChatRooms());

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      result.current.retry();

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });

    it("should reset rooms array when retrying after error", async () => {
      const firstPageData = [mockChatRoom];
      const secondPageData = [
        {
          ...mockChatRoom,
          id: "550e8400-e29b-41d4-a716-446655440005",
          name: "Chat with Jane",
          participant_names: ["Alice", "Jane"],
        },
      ];

      let callCount = 0;
      vi.spyOn(apiModule, "api").mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            count: 2,
            next: "http://localhost:8000/api/chat/rooms/?page=2",
            previous: null,
            results: firstPageData,
          };
        } else if (callCount === 2) {
          // Simulate error on loadMore
          throw new apiModule.ApiError(500, {}, "Server Error");
        } else if (callCount === 3) {
          // Simulate success on retry
          return {
            count: 1,
            next: null,
            previous: null,
            results: secondPageData,
          };
        }
        return { count: 0, next: null, previous: null, results: [] };
      });

      const { result } = renderHook(() => useChatRooms());

      await waitFor(() => {
        expect(result.current.rooms).toHaveLength(1);
      });

      expect(result.current.rooms).toEqual(firstPageData);

      // Trigger an error via loadMore
      result.current.loadMore();

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      expect(result.current.error).toBe("Error al cargar más conversaciones");

      // Now retry the initial fetch
      result.current.retry();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });

      expect(result.current.rooms).toEqual(secondPageData);
    });
  });

  describe("error handling", () => {
    it("should handle API 500 errors with user-friendly message", async () => {
      vi.spyOn(apiModule, "api").mockRejectedValueOnce(
        new apiModule.ApiError(500, {}, "Internal Server Error")
      );

      const { result } = renderHook(() => useChatRooms());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe("Error al cargar las conversaciones");
    });

    it("should handle API 400 errors", async () => {
      vi.spyOn(apiModule, "api").mockRejectedValueOnce(
        new apiModule.ApiError(400, { detail: ["Bad Request"] }, "Bad Request")
      );

      const { result } = renderHook(() => useChatRooms());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe("Error al cargar las conversaciones");
    });

    it("should handle network errors", async () => {
      vi.spyOn(apiModule, "api").mockRejectedValueOnce(
        new Error("Network failure")
      );

      const { result } = renderHook(() => useChatRooms());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe("Error de conexión");
    });

    it("should handle errors during loadMore", async () => {
      let callCount = 0;
      vi.spyOn(apiModule, "api").mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return mockPaginatedResponse;
        }
        throw new apiModule.ApiError(500, {}, "Internal Server Error");
      });

      const { result } = renderHook(() => useChatRooms());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.loadMore();

      await waitFor(() => {
        expect(result.current.isLoadingMore).toBe(false);
      }, { timeout: 1000 });

      expect(result.current.error).toBe(
        "Error al cargar más conversaciones"
      );
    });

    it("should preserve existing rooms when loadMore fails", async () => {
      const firstPage = {
        ...mockPaginatedResponse,
        results: [mockChatRoom],
      };

      vi.spyOn(apiModule, "api")
        .mockResolvedValueOnce(firstPage)
        .mockRejectedValueOnce(
          new apiModule.ApiError(500, {}, "Internal Server Error")
        );

      const { result } = renderHook(() => useChatRooms());

      await waitFor(() => {
        expect(result.current.rooms).toHaveLength(1);
      });

      result.current.loadMore();

      await waitFor(() => {
        expect(result.current.isLoadingMore).toBe(false);
      });

      expect(result.current.rooms).toHaveLength(1);
      expect(result.current.rooms[0]).toEqual(mockChatRoom);
    });

    it("should handle 401 errors (which redirect via api utility)", async () => {
      vi.spyOn(apiModule, "api").mockRejectedValueOnce(
        new apiModule.ApiError(401, {}, "Unauthorized")
      );

      const { result } = renderHook(() => useChatRooms());

      await waitFor(() => {
        expect(result.current.rooms).toBeDefined();
      });

      // 401 is handled by api() utility which redirects automatically
      // The hook state remains in initial loading state
      expect(result.current.rooms).toEqual([]);
    });
  });

  describe("return interface", () => {
    it("should return object with all required properties", async () => {
      vi.spyOn(apiModule, "api").mockResolvedValueOnce(mockPaginatedResponse);

      const { result } = renderHook(() => useChatRooms());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current).toHaveProperty("rooms");
      expect(result.current).toHaveProperty("isLoading");
      expect(result.current).toHaveProperty("isLoadingMore");
      expect(result.current).toHaveProperty("error");
      expect(result.current).toHaveProperty("hasMore");
      expect(result.current).toHaveProperty("loadMore");
      expect(result.current).toHaveProperty("retry");
    });

    it("should have rooms as array", async () => {
      vi.spyOn(apiModule, "api").mockResolvedValueOnce(mockPaginatedResponse);

      const { result } = renderHook(() => useChatRooms());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(Array.isArray(result.current.rooms)).toBe(true);
    });

    it("should have boolean loading flags", async () => {
      vi.spyOn(apiModule, "api").mockResolvedValueOnce(mockPaginatedResponse);

      const { result } = renderHook(() => useChatRooms());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.isLoading).toBe("boolean");
      expect(typeof result.current.isLoadingMore).toBe("boolean");
    });

    it("should have loadMore and retry as functions", async () => {
      vi.spyOn(apiModule, "api").mockResolvedValueOnce(mockPaginatedResponse);

      const { result } = renderHook(() => useChatRooms());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.loadMore).toBe("function");
      expect(typeof result.current.retry).toBe("function");
    });
  });

  describe("unmount behavior", () => {
    it("should cancel in-flight requests on unmount", async () => {
      const apiSpy = vi
        .spyOn(apiModule, "api")
        .mockImplementation(
          () =>
            new Promise((resolve) =>
              setTimeout(
                () => resolve(mockPaginatedResponse),
                100
              )
            )
        );

      const { unmount } = renderHook(() => useChatRooms());

      unmount();

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(apiSpy).toHaveBeenCalled();
    });

    it("should not throw errors on unmount", async () => {
      vi.spyOn(apiModule, "api").mockResolvedValueOnce(mockPaginatedResponse);

      const { unmount } = renderHook(() => useChatRooms());

      expect(() => unmount()).not.toThrow();
    });
  });

  describe("AbortController integration", () => {
    it("should prevent state updates after unmount", async () => {
      vi.spyOn(apiModule, "api").mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve(mockPaginatedResponse),
              50
            )
          )
      );

      const { unmount, result } = renderHook(() => useChatRooms());

      unmount();

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.rooms).toEqual([]);
    });
  });
});
