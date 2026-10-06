"use client";

import Link from "next/link";
import { Box } from "@/components/ui/Box";
import { buttonClass } from "@/components/ui/Button";
import { StatusMark } from "@/components/ui/Chip";
import { formatDate } from "@/lib/format";
import type { ReverseEvidence } from "@/lib/graph";
import type { Concept } from "@/lib/types";

const label = "text-[11px] font-bold uppercase tracking-wide text-text-2";
const RANK = { missing: 0, shaky: 1, solid: 2 } as const;

/**
 * Right-hand box on the Gap map: evidence for the selected concept, or (with
 * nothing selected) the weakest concepts to pick from, so it is never empty.
 */
export function DetailBox({
  concept,
  concepts,
  change,
  checks,
  practiceHref,
  onSelect,
  className = "",
}: {
  concept: Concept | undefined;
  concepts: Concept[];
  change?: string;
  checks: ReverseEvidence[];
  practiceHref: (label: string) => string;
  onSelect: (id: string) => void;
  className?: string;
}) {
  if (!concept) {
    const weakest = [...concepts].sort((a, b) => RANK[a.status] - RANK[b.status]).slice(0, 4);
    return (
      <Box id="detail" title="Concept detail" className={className} bodyClassName="gap-2">
        <p className="text-[13px] text-text-2">Select a node to see what you said about it. Weakest first:</p>
        <ul className="flex min-h-0 flex-col gap-1.5 overflow-y-auto">
          {weakest.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onSelect(c.id)}
                className="flex w-full items-center justify-between gap-2 rounded-[10px] border border-line bg-card-2 px-3 py-2 text-left text-[13px] transition-colors duration-150 hover:border-text-3"
              >
                <span className="font-semibold">{c.label}</span>
                <span className="shrink-0 text-text-2"><StatusMark status={c.status} /></span>
              </button>
            </li>
          ))}
        </ul>
      </Box>
    );
  }

  const notMentioned = concept.evidence.trim().toLowerCase() === "not mentioned";
  return (
    <Box id="detail" title="Concept detail" className={className} bodyClassName="gap-3 overflow-y-auto">
      <div aria-live="polite">
        <p className="text-[18px] font-bold leading-snug">{concept.label}</p>
        <p className="mt-1.5 flex items-center gap-2 text-[13px] font-semibold">
          <StatusMark status={concept.status} />
          {change && <span className="font-normal text-text-2">{change}</span>}
        </p>
      </div>
      <div>
        <p className={label}>What you said</p>
        {notMentioned ? (
          <p className="mt-1 text-[14px] text-text-2">Not mentioned.</p>
        ) : (
          <blockquote className="mt-1 border-l-2 border-lime pl-3 text-[14px] italic">{concept.evidence}</blockquote>
        )}
      </div>
      <div>
        <p className={label}>Note</p>
        <p className="mt-1 text-[14px]">{concept.note}</p>
      </div>
      {checks.length > 0 && (
        <div>
          <p className={label}>Catch the mistake</p>
          <ul className="mt-1 flex flex-col gap-1.5 text-[13px]">
            {checks.slice(0, 3).map((e, i) => (
              <li key={i}>
                <span className="tnum text-text-2">{formatDate(e.at)}:</span>{" "}
                {e.verdict === "caught" ? "You caught" : e.verdict === "partly" ? "You partly caught" : "You missed"} a planted
                error here. {e.correctFact}
              </li>
            ))}
          </ul>
        </div>
      )}
      <Link
        href={practiceHref(concept.label)}
        className={buttonClass(concept.status === "solid" ? "secondary" : "primary", "mt-auto self-start")}
      >
        Practice this concept
      </Link>
    </Box>
  );
}
