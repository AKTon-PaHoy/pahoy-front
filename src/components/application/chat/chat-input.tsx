import { type FormEvent, useRef, useState } from "react";
import { ArrowRight } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { cx } from "@/utils/cx";

export interface ChatInputProps {
  onSend: (content: string, attachment?: File) => Promise<boolean>;
  isSending: boolean;
  sendError: string | null;
  isGigOwner: boolean; // shows "Send Contract" placeholder button
}

const CHARACTER_LIMIT = 10000;
const WARNING_THRESHOLD = 9500;

export function ChatInput({
  onSend,
  isSending,
  sendError,
  isGigOwner,
}: ChatInputProps) {
  const [content, setContent] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const characterCount = content.length;
  const isAtLimit = characterCount >= CHARACTER_LIMIT;
  const showCharacterCounter = characterCount > WARNING_THRESHOLD;
  const isEmpty = content.trim().length === 0;
  const isDisabled = isSending || isEmpty;

  const handleInputChange = (newValue: string) => {
    // Prevent input beyond character limit
    if (newValue.length > CHARACTER_LIMIT) {
      return;
    }

    setContent(newValue);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isEmpty || isSending) return;

    const trimmedContent = content.trim();
    const success = await onSend(trimmedContent);

    if (success) {
      setContent("");
      // Clear any previous error when sending succeeds
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2 bg-white px-4 py-3">
      {/* Character counter - shown when approaching limit */}
      {showCharacterCounter && (
        <div
          className={cx(
            "text-right text-xs font-medium",
            isAtLimit ? "text-error-primary" : "text-tertiary",
          )}
        >
          {characterCount} / {CHARACTER_LIMIT}
        </div>
      )}

      {/* Input field */}
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Escribe un mensaje..."
          value={content}
          onChange={handleInputChange}
          isDisabled={isSending}
          size="md"
          className="flex-1"
          wrapperClassName="flex-1"
        />

        {/* Send button */}
        <Button
          type="submit"
          disabled={isDisabled}
          isLoading={isSending}
          size="md"
          color="primary"
          iconLeading={ArrowRight}
          aria-label="Enviar mensaje"
        />
      </div>

      {/* Optional: "Send Contract" placeholder button for gig owner */}
      {isGigOwner && (
        <Button
          type="button"
          disabled
          size="sm"
          color="secondary"
          className="w-full"
        >
          Enviar Contrato
        </Button>
      )}

      {/* Error message - shown when send fails */}
      {sendError && (
        <div className="text-sm font-medium text-error-primary">
          {sendError}
        </div>
      )}
    </form>
  );
}

ChatInput.displayName = "ChatInput";
