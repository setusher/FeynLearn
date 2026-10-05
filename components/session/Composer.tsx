"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/Button";
import { LIMITS } from "@/lib/limits";

/** Message input docked under the transcript, in normal page flow. */
export function Composer({
  disabled,
  onSend,
  hint,
}: {
  disabled: boolean;
  onSend: (text: string) => void;
  hint?: string;
}) {
  const [text, setText] = useState("");

  function submit(e?: FormEvent) {
    e?.preventDefault();
    const value = text.trim();
    if (!value || disabled) return;
    onSend(value);
    setText("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <form onSubmit={submit} className="mt-4">
      <label htmlFor="composer" className="sr-only">Your explanation</label>
      <div className="flex items-end gap-2 rounded-sm border border-line bg-surface p-2 focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-accent">
        <textarea
          id="composer"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          rows={3}
          maxLength={LIMITS.message}
          placeholder="Explain in your own words..."
          className="min-h-[72px] flex-1 resize-y bg-transparent px-2 py-1 text-[15px] leading-normal outline-none focus-visible:outline-none"
        />
        <Button type="submit" disabled={disabled || !text.trim()}>Send</Button>
      </div>
      <p className="mt-1 text-xs text-ink-2">
        Enter to send, Shift+Enter for a new line.{hint ? ` ${hint}` : ""}
      </p>
    </form>
  );
}
