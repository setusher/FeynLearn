"use client";

import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/Button";
import { LIMITS } from "@/lib/limits";
import { useSpeechInput } from "@/lib/speech";
import { MicButton } from "./MicButton";

/** Message input docked at the bottom of the Session box: textarea, mic, send. */
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
  // Text typed before voice input started; speech is appended to it.
  const base = useRef("");
  const voice = useSpeechInput((finalText, interim) => {
    const spoken = `${finalText}${interim}`.trim();
    setText(`${base.current}${base.current && spoken ? " " : ""}${spoken}`.slice(0, LIMITS.message));
  });

  function submit(e?: FormEvent) {
    e?.preventDefault();
    const value = text.trim();
    if (!value || disabled) return;
    if (voice.listening) voice.stop();
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
    <form onSubmit={submit} className="shrink-0 border-t border-line pt-3">
      <label htmlFor="composer" className="sr-only">Your explanation</label>
      <div className="flex items-end gap-2 rounded-[12px] border border-line bg-card-2 p-2 transition-colors duration-150 focus-within:border-lime">
        <textarea
          id="composer"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          rows={2}
          maxLength={LIMITS.message}
          placeholder="Explain in your own words..."
          className="max-h-40 min-h-[48px] flex-1 resize-none bg-transparent px-2 py-1.5 text-[15px] leading-normal text-text placeholder:text-text-3 outline-none focus-visible:outline-none"
        />
        {voice.supported && (
          <MicButton
            listening={voice.listening}
            disabled={disabled}
            onStart={() => {
              base.current = text.trim();
              voice.start();
            }}
            onStop={voice.stop}
          />
        )}
        <Button type="submit" disabled={disabled || !text.trim()}>Send</Button>
      </div>
      <p className="mt-1.5 text-[12px] text-text-2">
        {voice.listening ? "Listening. Press Stop when you are done." : "Enter to send, Shift+Enter for a new line."}
        {hint ? ` ${hint}` : ""}
      </p>
      {voice.error && <p className="mt-1 text-[13px] text-missing" role="alert">{voice.error}</p>}
    </form>
  );
}
