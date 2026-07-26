import { describe, it, expect, beforeEach, vi } from "vitest";
import type { ChatRoom, Message } from "@/types/chat";
import {
  sortMessages,
  deduplicateMessages,
  isValidMessageContent,
  formatMessageTimestamp,
  truncatePreview,
  resolveOtherParticipant,
} from "../chat";

describe("Chat Utilities", () => {
  describe("sortMessages", () => {
    it("sorts messages by timestamp ascending (oldest first)", () => {
      const messages: Message[] = [
        {
          id: "msg-3",
          room: "room-1",
          contract: null,
          sender: "user-1",
          sender_username: "alice",
          content: "Third",
          attachment: null,
          timestamp: "2024-01-03T10:00:00Z",
        },
        {
          id: "msg-1",
          room: "room-1",
          contract: null,
          sender: "user-1",
          sender_username: "alice",
          content: "First",
          attachment: null,
          timestamp: "2024-01-01T10:00:00Z",
        },
        {
          id: "msg-2",
          room: "room-1",
          contract: null,
          sender: "user-2",
          sender_username: "bob",
          content: "Second",
          attachment: null,
          timestamp: "2024-01-02T10:00:00Z",
        },
      ];

      const sorted = sortMessages(messages);
      expect(sorted[0].id).toBe("msg-1");
      expect(sorted[1].id).toBe("msg-2");
      expect(sorted[2].id).toBe("msg-3");
    });

    it("uses UUID as tie-breaker when timestamps are identical", () => {
      const messages: Message[] = [
        {
          id: "uuid-b",
          room: "room-1",
          contract: null,
          sender: "user-1",
          sender_username: "alice",
          content: "B",
          attachment: null,
          timestamp: "2024-01-01T10:00:00Z",
        },
        {
          id: "uuid-a",
          room: "room-1",
          contract: null,
          sender: "user-1",
          sender_username: "alice",
          content: "A",
          attachment: null,
          timestamp: "2024-01-01T10:00:00Z",
        },
      ];

      const sorted = sortMessages(messages);
      expect(sorted[0].id).toBe("uuid-a");
      expect(sorted[1].id).toBe("uuid-b");
    });

    it("does not mutate the original array", () => {
      const messages: Message[] = [
        {
          id: "msg-2",
          room: "room-1",
          contract: null,
          sender: "user-1",
          sender_username: "alice",
          content: "Second",
          attachment: null,
          timestamp: "2024-01-02T10:00:00Z",
        },
        {
          id: "msg-1",
          room: "room-1",
          contract: null,
          sender: "user-1",
          sender_username: "alice",
          content: "First",
          attachment: null,
          timestamp: "2024-01-01T10:00:00Z",
        },
      ];

      sortMessages(messages);
      expect(messages[0].id).toBe("msg-2"); // Original unchanged
    });
  });

  describe("deduplicateMessages", () => {
    it("merges two arrays removing duplicates by UUID", () => {
      const existing: Message[] = [
        {
          id: "msg-1",
          room: "room-1",
          contract: null,
          sender: "user-1",
          sender_username: "alice",
          content: "First",
          attachment: null,
          timestamp: "2024-01-01T10:00:00Z",
        },
      ];

      const incoming: Message[] = [
        {
          id: "msg-1",
          room: "room-1",
          contract: null,
          sender: "user-1",
          sender_username: "alice",
          content: "First (updated)",
          attachment: null,
          timestamp: "2024-01-01T10:00:00Z",
        },
        {
          id: "msg-2",
          room: "room-1",
          contract: null,
          sender: "user-2",
          sender_username: "bob",
          content: "Second",
          attachment: null,
          timestamp: "2024-01-02T10:00:00Z",
        },
      ];

      const result = deduplicateMessages(existing, incoming);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("msg-1");
      expect(result[0].content).toBe("First (updated)"); // Updated version kept
      expect(result[1].id).toBe("msg-2");
    });

    it("returns sorted result after deduplication", () => {
      const existing: Message[] = [
        {
          id: "msg-3",
          room: "room-1",
          contract: null,
          sender: "user-1",
          sender_username: "alice",
          content: "Third",
          attachment: null,
          timestamp: "2024-01-03T10:00:00Z",
        },
      ];

      const incoming: Message[] = [
        {
          id: "msg-1",
          room: "room-1",
          contract: null,
          sender: "user-1",
          sender_username: "alice",
          content: "First",
          attachment: null,
          timestamp: "2024-01-01T10:00:00Z",
        },
        {
          id: "msg-2",
          room: "room-1",
          contract: null,
          sender: "user-2",
          sender_username: "bob",
          content: "Second",
          attachment: null,
          timestamp: "2024-01-02T10:00:00Z",
        },
      ];

      const result = deduplicateMessages(existing, incoming);
      expect(result[0].id).toBe("msg-1");
      expect(result[1].id).toBe("msg-2");
      expect(result[2].id).toBe("msg-3");
    });
  });

  describe("isValidMessageContent", () => {
    it("accepts non-empty content with at least 1 non-whitespace char", () => {
      expect(isValidMessageContent("Hello")).toBe(true);
      expect(isValidMessageContent("a")).toBe(true);
      expect(isValidMessageContent("  a  ")).toBe(true);
    });

    it("rejects empty string", () => {
      expect(isValidMessageContent("")).toBe(false);
    });

    it("rejects whitespace-only content", () => {
      expect(isValidMessageContent("   ")).toBe(false);
      expect(isValidMessageContent("\n")).toBe(false);
      expect(isValidMessageContent("\t")).toBe(false);
    });

    it("rejects content exceeding 10,000 characters", () => {
      const tooLong = "a".repeat(10001);
      expect(isValidMessageContent(tooLong)).toBe(false);
    });

    it("accepts content exactly 10,000 characters", () => {
      const exact = "a".repeat(10000);
      expect(isValidMessageContent(exact)).toBe(true);
    });

    it("accepts content just under 10,000 characters", () => {
      const justUnder = "a".repeat(9999);
      expect(isValidMessageContent(justUnder)).toBe(true);
    });
  });

  describe("formatMessageTimestamp", () => {
    let now: Date;

    beforeEach(() => {
      now = new Date("2024-01-15T14:30:00Z");
      vi.setSystemTime(now);
    });

    it('formats "now" as "Ahora"', () => {
      const timestamp = now.toISOString();
      expect(formatMessageTimestamp(timestamp)).toBe("Ahora");
    });

    it('formats 1 minute ago as "Hace 1 min"', () => {
      const oneMinAgo = new Date(now.getTime() - 60 * 1000).toISOString();
      expect(formatMessageTimestamp(oneMinAgo)).toBe("Hace 1 min");
    });

    it('formats 5 minutes ago as "Hace 5 min"', () => {
      const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
      expect(formatMessageTimestamp(fiveMinAgo)).toBe("Hace 5 min");
    });

    it('formats 1 hour ago as "Hace 1 hora"', () => {
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      expect(formatMessageTimestamp(oneHourAgo)).toBe("Hace 1 hora");
    });

    it('formats 2 hours ago as "Hace 2 horas"', () => {
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
      expect(formatMessageTimestamp(twoHoursAgo)).toBe("Hace 2 horas");
    });

    it("formats 23 hours ago with relative time", () => {
      const almostADayAgo = new Date(now.getTime() - 23 * 60 * 60 * 1000).toISOString();
      expect(formatMessageTimestamp(almostADayAgo)).toBe("Hace 23 horas");
    });

    it("formats 24 hours ago with absolute format DD/MM/YYYY HH:mm", () => {
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const formatted = formatMessageTimestamp(oneDayAgo);
      expect(formatted).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
      // Check that the date part is correct (one day ago)
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const expectedDay = String(yesterday.getDate()).padStart(2, "0");
      const expectedMonth = String(yesterday.getMonth() + 1).padStart(2, "0");
      const expectedYear = yesterday.getFullYear();
      expect(formatted.startsWith(`${expectedDay}/${expectedMonth}/${expectedYear}`)).toBe(true);
    });

    it("formats past dates in absolute format DD/MM/YYYY HH:mm", () => {
      const pastDate = new Date("2024-01-10T09:15:00Z");
      const formatted = formatMessageTimestamp(pastDate.toISOString());
      expect(formatted).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
      // Check that the date part is correct
      expect(formatted.startsWith("10/01/2024")).toBe(true);
    });
  });

  describe("truncatePreview", () => {
    it("returns text unchanged if shorter than maxLength", () => {
      expect(truncatePreview("Hello", 80)).toBe("Hello");
      expect(truncatePreview("Short", 10)).toBe("Short");
    });

    it("truncates at default 80 characters and adds ellipsis", () => {
      const longText = "a".repeat(85);
      const result = truncatePreview(longText);
      expect(result).toBe("a".repeat(80) + "…");
      expect(result).toHaveLength(81); // 80 + ellipsis
    });

    it("truncates at custom maxLength and adds ellipsis", () => {
      const text = "a".repeat(50);
      const result = truncatePreview(text, 30);
      expect(result).toBe("a".repeat(30) + "…");
    });

    it("returns text as-is if exactly maxLength", () => {
      const text = "a".repeat(80);
      const result = truncatePreview(text, 80);
      expect(result).toBe(text);
    });

    it("handles custom maxLength of 1", () => {
      const result = truncatePreview("Hello", 1);
      expect(result).toBe("H…");
    });
  });

  describe("resolveOtherParticipant", () => {
    it("returns the other participant's name from participant_names", () => {
      const room: ChatRoom = {
        id: "room-1",
        name: "Chat 1",
        participants: ["user-alice", "user-bob"],
        participant_names: ["Alice", "Bob"],
        last_message: null,
        client_user: "user-alice",
        gig: "gig-1",
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
      };

      expect(resolveOtherParticipant(room, "user-alice")).toBe("Bob");
      expect(resolveOtherParticipant(room, "user-bob")).toBe("Alice");
    });

    it("returns first name if current user not found", () => {
      const room: ChatRoom = {
        id: "room-1",
        name: "Chat 1",
        participants: ["user-alice", "user-bob"],
        participant_names: ["Alice", "Bob"],
        last_message: null,
        client_user: "user-alice",
        gig: "gig-1",
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
      };

      expect(resolveOtherParticipant(room, "user-unknown")).toBe("Alice");
    });

    it("returns 'Unknown' if participant_names is empty", () => {
      const room: ChatRoom = {
        id: "room-1",
        name: "Chat 1",
        participants: ["user-alice", "user-bob"],
        participant_names: [],
        last_message: null,
        client_user: "user-alice",
        gig: "gig-1",
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
      };

      expect(resolveOtherParticipant(room, "user-alice")).toBe("Unknown");
    });

    it("correctly resolves with different participant orders", () => {
      const room: ChatRoom = {
        id: "room-1",
        name: "Chat 1",
        participants: ["user-bob", "user-alice"],
        participant_names: ["Bob", "Alice"],
        last_message: null,
        client_user: "user-alice",
        gig: "gig-1",
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
      };

      expect(resolveOtherParticipant(room, "user-alice")).toBe("Bob");
      expect(resolveOtherParticipant(room, "user-bob")).toBe("Alice");
    });
  });
});
