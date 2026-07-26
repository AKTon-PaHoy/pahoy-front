import { describe, expect, it } from "vitest";
import {
  sortMessages,
  isValidMessageContent,
  formatMessageTimestamp,
  truncatePreview,
  resolveOtherParticipant,
  deduplicateMessages,
} from "@/utils/chat";
import { Message, ChatRoom } from "@/types/chat";

const mockRoomId = "550e8400-e29b-41d4-a716-446655440000";
const mockUserId = "660e8400-e29b-41d4-a716-446655440001";

const createMockMessage = (
  overrides: Partial<Message> = {}
): Message => ({
  id: "msg-" + Math.random().toString(36).substr(2, 9),
  room: mockRoomId,
  contract: null,
  sender: mockUserId,
  sender_username: "TestUser",
  content: "Test message",
  attachment: null,
  timestamp: new Date().toISOString(),
  ...overrides,
});

const createMockRoom = (overrides: Partial<ChatRoom> = {}): ChatRoom => ({
  id: mockRoomId,
  name: "Test Room",
  participants: [mockUserId, "other-user-id"],
  participant_names: ["TestUser", "OtherUser"],
  last_message: "Last message",
  client_user: mockUserId,
  gig: "gig-id",
  is_active: true,
  created_at: new Date().toISOString(),
  ...overrides,
});

describe("Chat Utilities", () => {
  describe("sortMessages", () => {
    it("should sort messages by timestamp ascending", () => {
      const msg3 = createMockMessage({
        id: "msg3",
        timestamp: "2024-01-01T10:02:00Z",
      });
      const msg1 = createMockMessage({
        id: "msg1",
        timestamp: "2024-01-01T10:00:00Z",
      });
      const msg2 = createMockMessage({
        id: "msg2",
        timestamp: "2024-01-01T10:01:00Z",
      });

      const sorted = sortMessages([msg3, msg2, msg1]);

      expect(sorted[0].id).toBe("msg1");
      expect(sorted[1].id).toBe("msg2");
      expect(sorted[2].id).toBe("msg3");
    });

    it("should use UUID as tie-breaker for identical timestamps", () => {
      const timestamp = "2024-01-01T10:00:00Z";
      const msg1 = createMockMessage({ id: "aaa-msg", timestamp });
      const msg2 = createMockMessage({ id: "zzz-msg", timestamp });
      const msg3 = createMockMessage({ id: "bbb-msg", timestamp });

      const sorted = sortMessages([msg2, msg1, msg3]);

      expect(sorted[0].id).toBe("aaa-msg");
      expect(sorted[1].id).toBe("bbb-msg");
      expect(sorted[2].id).toBe("zzz-msg");
    });

    it("should handle empty array", () => {
      const sorted = sortMessages([]);
      expect(sorted).toEqual([]);
    });

    it("should handle single message", () => {
      const msg = createMockMessage({ id: "msg1" });
      const sorted = sortMessages([msg]);
      expect(sorted).toHaveLength(1);
      expect(sorted[0].id).toBe("msg1");
    });

    it("should not modify original array", () => {
      const messages = [
        createMockMessage({ id: "msg3", timestamp: "2024-01-01T10:02:00Z" }),
        createMockMessage({ id: "msg1", timestamp: "2024-01-01T10:00:00Z" }),
      ];
      const original = [...messages];

      sortMessages(messages);

      expect(messages).toEqual(original);
    });
  });

  describe("deduplicateMessages", () => {
    it("should merge and deduplicate messages by UUID", () => {
      const msg1 = createMockMessage({
        id: "msg1",
        timestamp: "2024-01-01T10:00:00Z",
      });
      const msg2 = createMockMessage({
        id: "msg2",
        timestamp: "2024-01-01T10:01:00Z",
      });
      const msg3 = createMockMessage({
        id: "msg3",
        timestamp: "2024-01-01T10:02:00Z",
      });

      const existing = [msg2, msg1];
      const incoming = [msg3, msg2]; // msg2 is duplicate

      const result = deduplicateMessages(existing, incoming);

      expect(result).toHaveLength(3);
      expect(result.filter((m) => m.id === "msg2")).toHaveLength(1);
    });

    it("should return sorted result (oldest first)", () => {
      const msg3 = createMockMessage({
        id: "msg3",
        timestamp: "2024-01-01T10:02:00Z",
      });
      const msg1 = createMockMessage({
        id: "msg1",
        timestamp: "2024-01-01T10:00:00Z",
      });
      const msg2 = createMockMessage({
        id: "msg2",
        timestamp: "2024-01-01T10:01:00Z",
      });

      const existing = [msg3];
      const incoming = [msg2, msg1];

      const result = deduplicateMessages(existing, incoming);

      expect(result[0].id).toBe("msg1");
      expect(result[1].id).toBe("msg2");
      expect(result[2].id).toBe("msg3");
    });

    it("should handle empty arrays", () => {
      const result = deduplicateMessages([], []);
      expect(result).toEqual([]);
    });
  });

  describe("isValidMessageContent", () => {
    it("should accept messages with at least 1 non-whitespace character", () => {
      expect(isValidMessageContent("a")).toBe(true);
      expect(isValidMessageContent("Hello")).toBe(true);
      expect(isValidMessageContent("  Hello  ")).toBe(true);
    });

    it("should reject empty strings", () => {
      expect(isValidMessageContent("")).toBe(false);
    });

    it("should reject whitespace-only strings", () => {
      expect(isValidMessageContent("   ")).toBe(false);
      expect(isValidMessageContent("\n")).toBe(false);
      expect(isValidMessageContent("\t")).toBe(false);
    });

    it("should reject messages exceeding 10,000 characters", () => {
      const longContent = "a".repeat(10001);
      expect(isValidMessageContent(longContent)).toBe(false);
    });

    it("should accept exactly 10,000 characters", () => {
      const content = "a".repeat(10000);
      expect(isValidMessageContent(content)).toBe(true);
    });

    it("should accept 9,999 characters", () => {
      const content = "a".repeat(9999);
      expect(isValidMessageContent(content)).toBe(true);
    });
  });

  describe("formatMessageTimestamp", () => {
    it("should format message less than 1 minute old as 'Ahora'", () => {
      const now = new Date();
      const timestamp = new Date(now.getTime() - 30000).toISOString();
      expect(formatMessageTimestamp(timestamp)).toBe("Ahora");
    });

    it("should format message less than 60 minutes old as 'Hace X min'", () => {
      const now = new Date();
      const timestamp = new Date(now.getTime() - 5 * 60000).toISOString();
      expect(formatMessageTimestamp(timestamp)).toMatch(/Hace \d+ min/);
    });

    it("should format message less than 24 hours old as 'Hace X horas'", () => {
      const now = new Date();
      const timestamp = new Date(now.getTime() - 2 * 60 * 60000).toISOString();
      expect(formatMessageTimestamp(timestamp)).toMatch(/Hace \d+ horas?/);
    });

    it("should format message 24+ hours old as 'DD/MM/YYYY HH:mm'", () => {
      const now = new Date();
      const timestamp = new Date(now.getTime() - 25 * 60 * 60000).toISOString();
      const formatted = formatMessageTimestamp(timestamp);
      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/);
    });
  });

  describe("truncatePreview", () => {
    it("should return text as-is if under 80 characters", () => {
      const text = "This is a short message";
      expect(truncatePreview(text)).toBe(text);
    });

    it("should truncate text exceeding 80 characters", () => {
      const text = "a".repeat(100);
      const truncated = truncatePreview(text);
      expect(truncated).toBe("a".repeat(80) + "…");
    });

    it("should handle exactly 80 characters", () => {
      const text = "a".repeat(80);
      expect(truncatePreview(text)).toBe(text);
    });

    it("should support custom maxLength", () => {
      const text = "a".repeat(100);
      const truncated = truncatePreview(text, 20);
      expect(truncated).toBe("a".repeat(20) + "…");
    });

    it("should return empty string as-is", () => {
      expect(truncatePreview("")).toBe("");
    });
  });

  describe("resolveOtherParticipant", () => {
    it("should return other participant's name when current user is at index 0", () => {
      const room = createMockRoom({
        participants: [mockUserId, "other-user-id"],
        participant_names: ["TestUser", "OtherUser"],
      });

      const result = resolveOtherParticipant(room, mockUserId);
      expect(result).toBe("OtherUser");
    });

    it("should handle when current user is at index 1", () => {
      const room = createMockRoom({
        participants: ["other-user-id", mockUserId],
        participant_names: ["OtherUser", "TestUser"],
      });

      const result = resolveOtherParticipant(room, mockUserId);
      expect(result).toBe("OtherUser");
    });

    it("should return first name if current user not found", () => {
      const room = createMockRoom({
        participants: ["unknown-id"],
        participant_names: ["FirstUser"],
      });

      const result = resolveOtherParticipant(room, mockUserId);
      expect(result).toBe("FirstUser");
    });

    it("should return 'Unknown' if no participant names available", () => {
      const room = createMockRoom({
        participants: ["unknown-id"],
        participant_names: [],
      });

      const result = resolveOtherParticipant(room, mockUserId);
      expect(result).toBe("Unknown");
    });
  });
});
