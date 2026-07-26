import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { useCurrentUser } from "@/hooks/use-current-user";
import * as apiModule from "@/utils/api";

describe("useCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("successful API call", () => {
    it("should fetch user data on mount and return user with id", async () => {
      const mockUser = { id: "550e8400-e29b-41d4-a716-446655440000" };
      vi.spyOn(apiModule, "api").mockResolvedValueOnce(mockUser);

      const { result } = renderHook(() => useCurrentUser());

      // Wait for async fetch to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.error).toBe(false);
    });

    it("should call GET /api/auth/user/ endpoint on first mount", async () => {
      const mockUser = { id: "550e8400-e29b-41d4-a716-446655440000" };
      const apiSpy = vi.spyOn(apiModule, "api").mockResolvedValueOnce(mockUser);

      renderHook(() => useCurrentUser());

      await waitFor(() => {
        expect(apiSpy).toHaveBeenCalledWith("/api/auth/user/");
      });
    });

    it("should return user object with UUID id field", async () => {
      const mockUser = { id: "550e8400-e29b-41d4-a716-446655440000" };
      vi.spyOn(apiModule, "api").mockResolvedValueOnce(mockUser);

      const { result } = renderHook(() => useCurrentUser());

      await waitFor(() => {
        expect(result.current.user).toBeDefined();
      });

      expect(result.current.user?.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });
  });

  describe("API error handling", () => {
    it("should handle API errors gracefully", async () => {
      vi.spyOn(apiModule, "api").mockRejectedValueOnce(
        new apiModule.ApiError(500, {}, "Internal Server Error")
      );

      const { result } = renderHook(() => useCurrentUser());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe(true);
      expect(result.current.user).toBeNull();
    });

    it("should handle validation errors from API", async () => {
      vi.spyOn(apiModule, "api").mockRejectedValueOnce(
        new apiModule.ApiError(400, { id: ["Invalid UUID"] }, "Bad Request")
      );

      const { result } = renderHook(() => useCurrentUser());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe(true);
      expect(result.current.user).toBeNull();
    });

    it("should handle network errors", async () => {
      vi.spyOn(apiModule, "api").mockRejectedValueOnce(
        new Error("Network failure")
      );

      const { result } = renderHook(() => useCurrentUser());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe(true);
    });
  });

  describe("return type interface", () => {
    it("should return object with user, isLoading, and error properties", async () => {
      const mockUser = { id: "550e8400-e29b-41d4-a716-446655440000" };
      vi.spyOn(apiModule, "api").mockResolvedValueOnce(mockUser);

      const { result } = renderHook(() => useCurrentUser());

      await waitFor(() => {
        expect(result.current.user).toBeDefined();
      });

      expect(result.current).toHaveProperty("user");
      expect(result.current).toHaveProperty("isLoading");
      expect(result.current).toHaveProperty("error");
    });

    it("should have isLoading and error as boolean properties", async () => {
      const mockUser = { id: "550e8400-e29b-41d4-a716-446655440000" };
      vi.spyOn(apiModule, "api").mockResolvedValueOnce(mockUser);

      const { result } = renderHook(() => useCurrentUser());

      await waitFor(() => {
        expect(result.current.user).toBeDefined();
      });

      expect(typeof result.current.isLoading).toBe("boolean");
      expect(typeof result.current.error).toBe("boolean");
    });

    it("should have user with id string when successfully fetched", async () => {
      const mockUser = { id: "12345678-1234-1234-1234-123456789012" };
      vi.spyOn(apiModule, "api").mockResolvedValueOnce(mockUser);

      const { result } = renderHook(() => useCurrentUser());

      await waitFor(() => {
        expect(result.current.user?.id).toBeDefined();
      });

      expect(typeof result.current.user?.id).toBe("string");
    });
  });

  describe("loading state management", () => {
    it("should set isLoading to false when fetch completes successfully", async () => {
      const mockUser = { id: "550e8400-e29b-41d4-a716-446655440000" };
      vi.spyOn(apiModule, "api").mockResolvedValueOnce(mockUser);

      const { result } = renderHook(() => useCurrentUser());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("should set error to false on successful fetch", async () => {
      const mockUser = { id: "550e8400-e29b-41d4-a716-446655440000" };
      vi.spyOn(apiModule, "api").mockResolvedValueOnce(mockUser);

      const { result } = renderHook(() => useCurrentUser());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe(false);
    });
  });

  describe("unmount behavior", () => {
    it("should clean up without throwing errors on unmount", async () => {
      const mockUser = { id: "550e8400-e29b-41d4-a716-446655440000" };
      vi.spyOn(apiModule, "api").mockResolvedValueOnce(mockUser);

      const { unmount } = renderHook(() => useCurrentUser());

      expect(() => unmount()).not.toThrow();
    });

    it("should handle unmounting during fetch", async () => {
      const mockUser = { id: "550e8400-e29b-41d4-a716-446655440000" };
      vi.spyOn(apiModule, "api").mockResolvedValueOnce(mockUser);

      const { unmount } = renderHook(() => useCurrentUser());

      // Unmount immediately without waiting for fetch
      expect(() => unmount()).not.toThrow();
    });
  });
});

