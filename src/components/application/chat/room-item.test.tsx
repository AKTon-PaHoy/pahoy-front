import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RoomItem } from "./room-item";

describe("RoomItem", () => {
  describe("rendering", () => {
    it("should render the participant name", () => {
      render(
        <RoomItem
          otherParticipantName="Juan"
          lastMessage="Hola, ¿cómo estás?"
          createdAt="2025-01-15T14:30:00Z"
          onClick={() => {}}
        />
      );

      expect(screen.getByText("Juan")).toBeInTheDocument();
    });

    it("should render the formatted timestamp", () => {
      // Use a recent timestamp to get relative time
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      render(
        <RoomItem
          otherParticipantName="Juan"
          lastMessage="Mensaje"
          createdAt={fiveMinutesAgo.toISOString()}
          onClick={() => {}}
        />
      );

      expect(screen.getByText("Hace 5 min")).toBeInTheDocument();
    });

    it("should render truncated message when it exceeds 80 characters", () => {
      const longMessage =
        "Este es un mensaje muy largo que definitivamente excede los ochenta caracteres límite que hemos establecido";

      render(
        <RoomItem
          otherParticipantName="Juan"
          lastMessage={longMessage}
          createdAt="2025-01-15T14:30:00Z"
          onClick={() => {}}
        />
      );

      const messageElement = screen.getByText(/Este es un mensaje muy largo.../);
      expect(messageElement).toBeInTheDocument();
    });

    it("should render full message when it is 80 characters or less", () => {
      const shortMessage = "Este es un mensaje corto";

      render(
        <RoomItem
          otherParticipantName="Juan"
          lastMessage={shortMessage}
          createdAt="2025-01-15T14:30:00Z"
          onClick={() => {}}
        />
      );

      expect(screen.getByText(shortMessage)).toBeInTheDocument();
    });

    it("should render placeholder text when lastMessage is null", () => {
      render(
        <RoomItem
          otherParticipantName="Juan"
          lastMessage={null}
          createdAt="2025-01-15T14:30:00Z"
          onClick={() => {}}
        />
      );

      expect(screen.getByText("Sin mensajes aún")).toBeInTheDocument();
    });

    it("should render placeholder text when lastMessage is empty string", () => {
      render(
        <RoomItem
          otherParticipantName="Juan"
          lastMessage=""
          createdAt="2025-01-15T14:30:00Z"
          onClick={() => {}}
        />
      );

      // Empty string is falsy, so placeholder should be shown
      expect(screen.getByText("Sin mensajes aún")).toBeInTheDocument();
    });
  });

  describe("interaction", () => {
    it("should call onClick when clicked", () => {
      const handleClick = vi.fn();

      render(
        <RoomItem
          otherParticipantName="Juan"
          lastMessage="Hola"
          createdAt="2025-01-15T14:30:00Z"
          onClick={handleClick}
        />
      );

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledOnce();
    });
  });

  describe("edge cases", () => {
    it("should handle exactly 80 character message without truncation", () => {
      const exactlyEightyChars =
        "A".repeat(80);

      render(
        <RoomItem
          otherParticipantName="Juan"
          lastMessage={exactlyEightyChars}
          createdAt="2025-01-15T14:30:00Z"
          onClick={() => {}}
        />
      );

      expect(screen.getByText(exactlyEightyChars)).toBeInTheDocument();
    });

    it("should handle 81 character message with truncation", () => {
      const eightyOneChars = "A".repeat(81);
      const expectedText = "A".repeat(80) + "…";

      render(
        <RoomItem
          otherParticipantName="Juan"
          lastMessage={eightyOneChars}
          createdAt="2025-01-15T14:30:00Z"
          onClick={() => {}}
        />
      );

      expect(screen.getByText(expectedText)).toBeInTheDocument();
    });

    it("should handle old messages with absolute timestamp format", () => {
      // 25 hours ago
      const oldDate = new Date(
        new Date().getTime() - 25 * 60 * 60 * 1000
      ).toISOString();

      render(
        <RoomItem
          otherParticipantName="Juan"
          lastMessage="Mensaje antiguo"
          createdAt={oldDate}
          onClick={() => {}}
        />
      );

      // Verify it shows a date format (DD/MM/YYYY HH:mm)
      const elements = screen.getAllByText(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/);
      expect(elements.length).toBeGreaterThan(0);
    });

    it("should handle special characters in participant name", () => {
      const specialName = "Juan & María's Friend";

      render(
        <RoomItem
          otherParticipantName={specialName}
          lastMessage="Hola"
          createdAt="2025-01-15T14:30:00Z"
          onClick={() => {}}
        />
      );

      expect(screen.getByText(specialName)).toBeInTheDocument();
    });

    it("should handle special characters in message preview", () => {
      const messageWithSpecialChars =
        "¡Hola! ¿Cómo estás? & te envío saludos <3";

      render(
        <RoomItem
          otherParticipantName="Juan"
          lastMessage={messageWithSpecialChars}
          createdAt="2025-01-15T14:30:00Z"
          onClick={() => {}}
        />
      );

      expect(screen.getByText(messageWithSpecialChars)).toBeInTheDocument();
    });
  });
});
