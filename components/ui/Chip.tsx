import type { ReactNode } from "react";
import type { ConceptStatus } from "@/lib/types";

type Tone = "neutral" | "lime" | "outline";

const tones: Record<Tone, string> = {
  neutral: "bg-card-2 text-text-2 border-line",
  lime: "bg-lime text-on-lime border-lime",
  outline: "bg-transparent text-text border-line",
};

/** Small pill chip. Chips and nav tabs are the only pill-shaped elements. */
export function Chip({ tone = "neutral", className = "", children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <span
      className={`tnum inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 text-[12px] font-semibold ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export const STATUS_VAR: Record<ConceptStatus, string> = {
  solid: "var(--solid)",
  shaky: "var(--shaky)",
  missing: "var(--missing)",
};

const STATUS_TEXT: Record<ConceptStatus, string> = { solid: "Solid", shaky: "Shaky", missing: "Missing" };

/** Colored square plus a text label, so status is never color-only. */
export function StatusMark({ status, label }: { status: ConceptStatus; label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden className="inline-block h-2 w-2 shrink-0 rounded-[2px]" style={{ background: STATUS_VAR[status] }} />
      <span>{label ?? STATUS_TEXT[status]}</span>
    </span>
  );
}

export function SampleChip() {
  return <Chip>Sample data</Chip>;
}
