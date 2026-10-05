import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";
import { STATUS_LABEL } from "@/lib/graph";
import type { Concept } from "@/lib/types";
import { STATUS_COLOR } from "./ConceptGraph";

/** In-flow panel beside the graph with the evidence for one concept. */
export function ConceptDetail({
  concept,
  change,
  practiceHref,
}: {
  concept: Concept | undefined;
  change?: string;
  practiceHref: (label: string) => string;
}) {
  if (!concept) {
    return (
      <aside className="border-t border-line pt-4 text-sm text-ink-2 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
        Select a concept to see the evidence from your session.
      </aside>
    );
  }
  const notMentioned = concept.evidence.trim().toLowerCase() === "not mentioned";
  return (
    <aside
      aria-live="polite"
      className="border-t border-line pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0"
    >
      <h2 className="text-lg">{concept.label}</h2>
      <p className="mt-2 flex items-center gap-2 text-sm">
        <span aria-hidden className="inline-block h-2.5 w-2.5" style={{ background: STATUS_COLOR[concept.status] }} />
        <span className="font-medium">{STATUS_LABEL[concept.status]}</span>
        {change && <span className="text-ink-2">{change}</span>}
      </p>

      <h3 className="mt-5 font-sans text-xs font-semibold uppercase tracking-wide text-ink-2">
        What you said
      </h3>
      {notMentioned ? (
        <p className="mt-1 text-ink-2">Not mentioned.</p>
      ) : (
        <blockquote className="mt-1 border-l-2 border-line pl-3 italic">{concept.evidence}</blockquote>
      )}

      <h3 className="mt-5 font-sans text-xs font-semibold uppercase tracking-wide text-ink-2">Note</h3>
      <p className="mt-1">{concept.note}</p>

      <Link
        href={practiceHref(concept.label)}
        className={buttonClass(concept.status === "solid" ? "secondary" : "primary", "mt-6")}
      >
        Practice this concept
      </Link>
    </aside>
  );
}
