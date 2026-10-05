import { formatDate } from "@/lib/format";
import { personaLabel } from "@/lib/personas";
import type { Concept, Session } from "@/lib/types";

function counts(concepts: Concept[]) {
  return {
    solid: concepts.filter((c) => c.status === "solid").length,
    shaky: concepts.filter((c) => c.status === "shaky").length,
    missing: concepts.filter((c) => c.status === "missing").length,
  };
}

/** Summary of one analyzed attempt, shown above the map. */
export function AttemptSummary({ session, isNew }: { session: Session; isNew: boolean }) {
  const c = counts(session.concepts ?? []);
  return (
    <section
      aria-labelledby="summary-heading"
      className={`mb-8 border border-line bg-surface p-5 ${isNew ? "border-l-[3px] border-l-accent" : ""}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 id="summary-heading" className="text-lg">
          {isNew ? "Your session summary" : "Attempt summary"}
        </h2>
        <p className="tnum text-sm text-ink-2">
          {formatDate(session.endedAt ?? session.startedAt)}
          {session.persona ? ` · explained to a ${personaLabel(session.persona).toLowerCase()}` : ""}
        </p>
      </div>
      {session.summary && <p className="mt-2 max-w-[680px]">{session.summary}</p>}

      <dl className="tnum mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
        <div>
          <dt className="text-ink-2">Understanding</dt>
          <dd className="font-serif text-2xl">{session.score ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-ink-2">Coverage</dt>
          <dd className="font-serif text-2xl">{session.coverage ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-ink-2">Accuracy</dt>
          <dd className="font-serif text-2xl">{session.accuracy ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-ink-2">Concepts</dt>
          <dd className="pt-1.5">
            {c.solid} solid, {c.shaky} shaky, {c.missing} missing
          </dd>
        </div>
      </dl>

      {session.misconceptions && session.misconceptions.length > 0 && (
        <div className="mt-4 border-l-[3px] border-shaky bg-tint-shaky px-4 py-3 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-shaky">
            Misconceptions in this session
          </p>
          <ul className="mt-1 flex flex-col gap-1">
            {session.misconceptions.map((m, i) => (
              <li key={i}>
                <span className="font-medium">{m.name}.</span> {m.correction}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
