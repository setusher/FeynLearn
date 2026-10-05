"use client";

import { Mic, Square } from "lucide-react";

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
      className={`inline-flex h-9 items-center gap-2 rounded-sm border px-3 text-sm font-medium transition-colors duration-150 disabled:opacity-50 ${
        listening ? "border-missing bg-tint-missing text-ink" : "border-line bg-surface hover:bg-bg"
      }`}
    >
      {listening ? <Square size={14} strokeWidth={1.5} aria-hidden /> : <Mic size={16} strokeWidth={1.5} aria-hidden />}
      {listening ? "Stop" : "Mic"}
    </button>
  );
}
