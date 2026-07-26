import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MessageBubble } from "../message-bubble";

describe("MessageBubble", () => {
  describe("Rendering", () => {
    it("renders the message content", () => {
      render(
        <MessageBubble
          content="Hello, world!"
          senderUsername="Alice"
          timestamp="2024-01-15T10:30:00Z"
          isOwnMessage={false}
        />
      );

      expect(screen.getByText("Hello, world!")).toBeInTheDocument();
    });

    it("renders the sender username", () => {
      render(
        <MessageBubble
          content="Test message"
          senderUsername="Bob"
          timestamp="2024-01-15T10:30:00Z"
          isOwnMessage={false}
        />
      );

      expect(screen.getByText("Bob")).toBeInTheDocument();
    });

    it("renders formatted timestamp", () => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      render(
        <MessageBubble
          content="Test"
          senderUsername="User"
          timestamp={fiveMinutesAgo.toISOString()}
          isOwnMessage={false}
        />
      );

      expect(screen.getByText(/Hace 5 min/)).toBeInTheDocument();
    });
  });

  describe("Styling - Own Messages", () => {
    it("applies right-alignment for own messages", () => {
      const { container } = render(
        <MessageBubble
          content="My message"
          senderUsername="Me"
          timestamp="2024-01-15T10:30:00Z"
          isOwnMessage={true}
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("items-end");
    });

    it("applies brand-50 background for own messages", () => {
      const { container } = render(
        <MessageBubble
          content="My message"
          senderUsername="Me"
          timestamp="2024-01-15T10:30:00Z"
          isOwnMessage={true}
        />
      );

      const bubble = container.querySelector("div > div:nth-child(2)") as HTMLElement;
      expect(bubble.className).toContain("bg-brand-50");
      expect(bubble.className).toContain("text-brand-700");
    });
  });

  describe("Styling - Other Messages", () => {
    it("applies left-alignment for other messages", () => {
      const { container } = render(
        <MessageBubble
          content="Their message"
          senderUsername="Them"
          timestamp="2024-01-15T10:30:00Z"
          isOwnMessage={false}
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("items-start");
    });

    it("applies neutral-50 background for other messages", () => {
      const { container } = render(
        <MessageBubble
          content="Their message"
          senderUsername="Them"
          timestamp="2024-01-15T10:30:00Z"
          isOwnMessage={false}
        />
      );

      const bubble = container.querySelector("div > div:nth-child(2)") as HTMLElement;
      expect(bubble.className).toContain("bg-neutral-50");
      expect(bubble.className).toContain("text-neutral-700");
    });
  });

  describe("Attachments", () => {
    it("renders attachment link when present", () => {
      render(
        <MessageBubble
          content="Check this out"
          senderUsername="User"
          timestamp="2024-01-15T10:30:00Z"
          isOwnMessage={false}
          attachment="https://example.com/file.pdf"
        />
      );

      const link = screen.getByRole("link");
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "https://example.com/file.pdf");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("displays 'Ver imagen' for image attachments", () => {
      render(
        <MessageBubble
          content="Look at this"
          senderUsername="User"
          timestamp="2024-01-15T10:30:00Z"
          isOwnMessage={false}
          attachment="https://example.com/photo.jpg"
        />
      );

      expect(screen.getByText("Ver imagen")).toBeInTheDocument();
    });

    it("displays 'Ver imagen' for .png files", () => {
      render(
        <MessageBubble
          content="Screenshot"
          senderUsername="User"
          timestamp="2024-01-15T10:30:00Z"
          isOwnMessage={false}
          attachment="https://example.com/screenshot.png"
        />
      );

      expect(screen.getByText("Ver imagen")).toBeInTheDocument();
    });

    it("displays 'Ver imagen' for .webp files", () => {
      render(
        <MessageBubble
          content="Modern image"
          senderUsername="User"
          timestamp="2024-01-15T10:30:00Z"
          isOwnMessage={false}
          attachment="https://example.com/image.webp"
        />
      );

      expect(screen.getByText("Ver imagen")).toBeInTheDocument();
    });

    it("displays 'Ver archivo' for non-image attachments", () => {
      render(
        <MessageBubble
          content="Document"
          senderUsername="User"
          timestamp="2024-01-15T10:30:00Z"
          isOwnMessage={false}
          attachment="https://example.com/document.pdf"
        />
      );

      expect(screen.getByText("Ver archivo")).toBeInTheDocument();
    });

    it("does not render attachment when not provided", () => {
      const { container } = render(
        <MessageBubble
          content="No attachment"
          senderUsername="User"
          timestamp="2024-01-15T10:30:00Z"
          isOwnMessage={false}
        />
      );

      const links = container.querySelectorAll("a");
      expect(links.length).toBe(0);
    });

    it("does not render attachment when null", () => {
      const { container } = render(
        <MessageBubble
          content="No attachment"
          senderUsername="User"
          timestamp="2024-01-15T10:30:00Z"
          isOwnMessage={false}
          attachment={null}
        />
      );

      const links = container.querySelectorAll("a");
      expect(links.length).toBe(0);
    });

    it("applies correct link colors for own messages with attachment", () => {
      const { container } = render(
        <MessageBubble
          content="Check this"
          senderUsername="Me"
          timestamp="2024-01-15T10:30:00Z"
          isOwnMessage={true}
          attachment="https://example.com/image.jpg"
        />
      );

      const link = container.querySelector("a") as HTMLElement;
      expect(link.className).toContain("text-brand-600");
    });

    it("applies correct link colors for other messages with attachment", () => {
      const { container } = render(
        <MessageBubble
          content="Check this"
          senderUsername="Them"
          timestamp="2024-01-15T10:30:00Z"
          isOwnMessage={false}
          attachment="https://example.com/image.jpg"
        />
      );

      const link = container.querySelector("a") as HTMLElement;
      expect(link.className).toContain("text-neutral-600");
    });
  });

  describe("Edge Cases", () => {
    it("handles very long messages with word wrap", () => {
      const longMessage = "a".repeat(300);
      render(
        <MessageBubble
          content={longMessage}
          senderUsername="User"
          timestamp="2024-01-15T10:30:00Z"
          isOwnMessage={false}
        />
      );

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it("handles empty username", () => {
      render(
        <MessageBubble
          content="Message"
          senderUsername=""
          timestamp="2024-01-15T10:30:00Z"
          isOwnMessage={false}
        />
      );

      expect(screen.getByText("Message")).toBeInTheDocument();
    });

    it("handles special characters in content", () => {
      const specialContent = "Hello <script>alert('xss')</script> & \"quoted\"";
      render(
        <MessageBubble
          content={specialContent}
          senderUsername="User"
          timestamp="2024-01-15T10:30:00Z"
          isOwnMessage={false}
        />
      );

      expect(screen.getByText(specialContent)).toBeInTheDocument();
    });

    it("handles timestamps from different time periods", () => {
      // 25 hours ago
      const oldDate = new Date();
      oldDate.setHours(oldDate.getHours() - 25);

      render(
        <MessageBubble
          content="Old message"
          senderUsername="User"
          timestamp={oldDate.toISOString()}
          isOwnMessage={false}
        />
      );

      // Should show absolute format DD/MM/YYYY HH:mm
      const timestamp = screen.getAllByText(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/);
      expect(timestamp.length).toBeGreaterThan(0);
    });

    it("accepts and applies custom className", () => {
      const { container } = render(
        <MessageBubble
          content="Message"
          senderUsername="User"
          timestamp="2024-01-15T10:30:00Z"
          isOwnMessage={false}
          className="custom-class"
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("custom-class");
    });
  });

  describe("Message Alignment Property", () => {
    it("verifies message alignment is determined by sender identity", () => {
      // Own message should be right-aligned
      const { container: ownContainer } = render(
        <MessageBubble
          content="Own"
          senderUsername="Me"
          timestamp="2024-01-15T10:30:00Z"
          isOwnMessage={true}
        />
      );
      const ownWrapper = ownContainer.firstChild as HTMLElement;
      expect(ownWrapper.className).toContain("items-end");

      // Other message should be left-aligned
      const { container: otherContainer } = render(
        <MessageBubble
          content="Other"
          senderUsername="Them"
          timestamp="2024-01-15T10:30:00Z"
          isOwnMessage={false}
        />
      );
      const otherWrapper = otherContainer.firstChild as HTMLElement;
      expect(otherWrapper.className).toContain("items-start");
    });
  });
});
