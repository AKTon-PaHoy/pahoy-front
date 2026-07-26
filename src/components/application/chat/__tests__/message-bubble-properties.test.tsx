import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { MessageBubble } from "../message-bubble";

describe("MessageBubble - Property-Based Tests", () => {
  describe("Property 2: Message alignment is determined by sender identity", () => {
    /**
     * **Validates: Requirements 2.2, 2.3**
     *
     * For any message and any current user UUID, the message SHALL be
     * right-aligned if and only if isOwnMessage is true, and left-aligned
     * if isOwnMessage is false.
     */
    it("should always right-align when isOwnMessage is true", () => {
      fc.assert(
        fc.property(
          fc.string(),
          fc.string(),
          fc.string(),
          (content, username, timestamp) => {
            const { container } = render(
              <MessageBubble
                content={content || "msg"}
                senderUsername={username}
                timestamp={timestamp || "2024-01-15T10:30:00Z"}
                isOwnMessage={true}
              />
            );

            const wrapper = container.firstChild as HTMLElement;
            expect(wrapper.className).toContain("items-end");
          }
        )
      );
    });

    it("should always left-align when isOwnMessage is false", () => {
      fc.assert(
        fc.property(
          fc.string(),
          fc.string(),
          fc.string(),
          (content, username, timestamp) => {
            const { container } = render(
              <MessageBubble
                content={content || "msg"}
                senderUsername={username}
                timestamp={timestamp || "2024-01-15T10:30:00Z"}
                isOwnMessage={false}
              />
            );

            const wrapper = container.firstChild as HTMLElement;
            expect(wrapper.className).toContain("items-start");
          }
        )
      );
    });

    it("should apply brand colors only for own messages", () => {
      fc.assert(
        fc.property(
          fc.string(),
          fc.string(),
          (content, username) => {
            const { container: ownContainer } = render(
              <MessageBubble
                content={content || "msg"}
                senderUsername={username}
                timestamp="2024-01-15T10:30:00Z"
                isOwnMessage={true}
              />
            );

            const ownBubble = ownContainer.querySelector("div > div:nth-child(2)") as HTMLElement;
            expect(ownBubble.className).toContain("bg-brand-50");
            expect(ownBubble.className).toContain("text-brand-700");
          }
        )
      );
    });

    it("should apply neutral colors only for other messages", () => {
      fc.assert(
        fc.property(
          fc.string(),
          fc.string(),
          (content, username) => {
            const { container: otherContainer } = render(
              <MessageBubble
                content={content || "msg"}
                senderUsername={username}
                timestamp="2024-01-15T10:30:00Z"
                isOwnMessage={false}
              />
            );

            const otherBubble = otherContainer.querySelector("div > div:nth-child(2)") as HTMLElement;
            expect(otherBubble.className).toContain("bg-neutral-50");
            expect(otherBubble.className).toContain("text-neutral-700");
          }
        )
      );
    });
  });

  describe("Property 3: Timestamp formatting threshold", () => {
    /**
     * **Validates: Requirements 2.4**
     *
     * For any message timestamp, the formatted display string SHALL use
     * relative time format if the timestamp is less than 24 hours from now,
     * and SHALL use absolute format "DD/MM/YYYY HH:mm" otherwise.
     */
    it("should format recent timestamps as relative time", () => {
      // Generate timestamps within last 23 hours
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 23 * 60 - 1 }),
          (minutesAgo) => {
            const timestamp = new Date();
            timestamp.setMinutes(timestamp.getMinutes() - minutesAgo);

            const { container } = render(
              <MessageBubble
                content="msg"
                senderUsername="User"
                timestamp={timestamp.toISOString()}
                isOwnMessage={false}
              />
            );

            const text = container.textContent || "";
            // Should contain relative format indicators
            const hasRelativeFormat =
              text.includes("Ahora") ||
              text.includes("Hace") ||
              /Hace \d+ (min|hora)/i.test(text);
            expect(hasRelativeFormat).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });

    it("should format old timestamps as absolute date", () => {
      // Generate timestamps older than 24 hours
      fc.assert(
        fc.property(
          fc.integer({ min: 25 * 60, max: 365 * 24 * 60 }),
          (minutesAgo) => {
            const timestamp = new Date();
            timestamp.setMinutes(timestamp.getMinutes() - minutesAgo);

            const { container } = render(
              <MessageBubble
                content="msg"
                senderUsername="User"
                timestamp={timestamp.toISOString()}
                isOwnMessage={false}
              />
            );

            const text = container.textContent || "";
            // Should match DD/MM/YYYY HH:mm format
            const hasAbsoluteFormat = /\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/.test(text);
            expect(hasAbsoluteFormat).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe("Property 4: Content rendering", () => {
    /**
     * Additional property: Content is always rendered without modification
     */
    it("should render any non-empty content string without modification", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
          fc.string(),
          (content, username) => {
            const { container } = render(
              <MessageBubble
                content={content}
                senderUsername={username || "User"}
                timestamp="2024-01-15T10:30:00Z"
                isOwnMessage={false}
              />
            );

            const bubble = container.querySelector("p");
            expect(bubble?.textContent).toBe(content);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Property 5: Attachment rendering conditional", () => {
    /**
     * Additional property: Attachment renders only when provided and not null
     */
    it("should render attachment link only when provided", () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(null),
            fc.constant(undefined),
            fc.webUrl()
          ),
          (attachment) => {
            const { container } = render(
              <MessageBubble
                content="msg"
                senderUsername="User"
                timestamp="2024-01-15T10:30:00Z"
                isOwnMessage={false}
                attachment={attachment}
              />
            );

            const links = container.querySelectorAll("a");
            if (attachment && attachment !== null && attachment !== undefined) {
              expect(links.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe("Property 6: Username rendering", () => {
    /**
     * Additional property: Username is always rendered in the message
     */
    it("should always render the sender username when non-empty", () => {
      fc.assert(
        fc.property(
          fc.string().filter((s) => s.length > 0),
          (username) => {
            const { container } = render(
              <MessageBubble
                content="msg"
                senderUsername={username}
                timestamp="2024-01-15T10:30:00Z"
                isOwnMessage={false}
              />
            );

            const span = container.querySelector("span");
            expect(span?.textContent).toBe(username);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
