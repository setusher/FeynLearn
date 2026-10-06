"use client";

import { Mic } from "lucide-react";

/** Toggle for voice input. Render only when speech input is supported. */
export function MicButton({
  listening,
  disabled,
  onStart,
  onStop,
}: {
  listening: boolean;
  disabled?: boolean;
  onStart: () => void;
  onStop: () => void;
}) {
  return (
    <button
      type="button"
      onClick={listening ? onStop : onStart}
      disabled={disabled}
      aria-pressed={listening}
      aria-label={listening ? "Stop voice input" : "Start voice input"}
      className={`inline-flex h-10 items-center gap-2 rounded-[12px] border px-3 text-[13px] font-semibold transition-colors duration-150 disabled:opacity-50 ${
        listening ? "border-missing bg-tint-missing text-text" : "border-line bg-card text-text hover:border-text-3"
      }`}
    >
      <Mic size={16} strokeWidth={1.75} aria-hidden />
      {listening ? "Stop" : "Mic"}
    </button>
  );
}
