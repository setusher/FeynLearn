"use client";

import { Box } from "@/components/ui/Box";
import { STATUS_VAR, SampleChip } from "@/components/ui/Chip";
import { formatDate } from "@/lib/format";
import { personaLabel } from "@/lib/personas";
import type { Concept, ConceptStatus, Session } from "@/lib/types";

const STATUSES: { key: ConceptStatus; label: string }[] = [
  { key: "solid", label: "Solid" },
  { key: "shaky", label: "Shaky" },
  { key: "missing", label: "Missing" },
];

/** Counts per status for the attempt being shown, with its scores and summary. */
export function SummaryBox({
  session,
  concepts,
  sample,
  isNew,
  className = "",
}: {
  session: Session;
  concepts: Concept[];
  sample?: boolean;
  isNew: boolean;
  className?: string;
}) {
  return (
    <Box
      id="summary"
      title={isNew ? "Your session summary" : "Attempt summary"}
      className={className}
      extra={sample ? <SampleChip /> : undefined}
      bodyClassName="gap-3 overflow-y-auto"
    >
      <div className="grid grid-cols-3 gap-2">
        {STATUSES.map((s) => (
          <div key={s.key} className="rounded-[12px] border border-line bg-card-2 p-2.5">
            <p className="flex items-center gap-1.5 text-[12px] font-semibold text-text-2">
              <span aria-hidden className="h-2 w-2 rounded-[2px]" style={{ background: STATUS_VAR[s.key] }} />
              {s.label}
            </p>
            <p className="tnum mt-1 text-[32px] font-bold leading-none">{concepts.filter((c) => c.status === s.key).length}</p>
          </div>
        ))}
      </div>
      <p className="tnum flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-text-2">
        <span>
          Understanding <span className="font-bold text-lime">{session.score ?? "-"}</span>
        </span>
        <span>
          Coverage <span className="font-bold text-text">{session.coverage ?? "-"}</span>
        </span>
        <span>
          Accuracy <span className="font-bold text-text">{session.accuracy ?? "-"}</span>
        </span>
      </p>
      <p className="text-[12px] text-text-2">
        {formatDate(session.endedAt ?? session.startedAt)}
        {session.persona ? `, explained to a ${personaLabel(session.persona).toLowerCase()}` : ""}
      </p>
      {session.summary && <p className="text-[14px]">{session.summary}</p>}
      {session.misconceptions && session.misconceptions.length > 0 && (
        <div className="rounded-[12px] border border-line border-l-[3px] border-l-shaky bg-tint-shaky px-3 py-2 text-[13px]">
          <p className="text-[11px] font-bold uppercase tracking-wide text-shaky">Misconceptions</p>
          <ul className="mt-1 flex flex-col gap-1">
            {session.misconceptions.map((m, i) => (
              <li key={i}>
                <span className="font-semibold">{m.name}.</span> {m.correction}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Box>
  );
}
