import type { ReverseResult, Verdict } from "@/lib/types";

const VERDICT: Record<Verdict, { label: string; color: string }> = {
  caught: { label: "Caught", color: "var(--status-solid)" },
  partly: { label: "Partly", color: "var(--status-shaky)" },
  missed: { label: "Missed", color: "var(--status-missing)" },
};

function Marker({ verdict }: { verdict: Verdict }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium">
      <span aria-hidden className="inline-block h-2.5 w-2.5" style={{ background: VERDICT[verdict].color }} />
      {VERDICT[verdict].label}
    </span>
  );
}

const label = "font-sans text-xs font-semibold uppercase tracking-wide text-ink-2";

/** The reveal screen: every planted error with a verdict, then false alarms. */
export function ReverseResults({ result }: { result: ReverseResult }) {
  const verdicts = result.verdicts ?? [];
  const caught = verdicts.filter((v) => v.verdict === "caught").length;
  const partly = verdicts.filter((v) => v.verdict === "partly").length;
  const reasons = new Map(result.flags.map((f) => [f.index, f.reason]));

  return (
    <div className="flex flex-col gap-8">
      <section className="border border-line bg-surface p-5" aria-labelledby="result-heading">
        <h2 id="result-heading" className="text-lg">Results</h2>
        <p className="mt-1">
          You caught {caught} of {verdicts.length} planted {verdicts.length === 1 ? "mistake" : "mistakes"}
          {partly ? `, and partly caught ${partly}` : ""}
          {result.falseAlarms?.length
            ? `. ${result.falseAlarms.length} ${result.falseAlarms.length === 1 ? "flag was a false alarm" : "flags were false alarms"}.`
            : "."}
        </p>
        <p className="mt-3 text-sm text-ink-2">
          Score <span className="tnum font-serif text-2xl text-ink">{result.score ?? "-"}</span> out of 100
        </p>
      </section>

      <section aria-labelledby="errors-heading">
        <h2 id="errors-heading" className="mb-3 text-xl">Planted mistakes</h2>
        <ol className="border-t border-line">
          {verdicts.map((v) => (
            <li key={v.index} className="border-b border-line py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm text-ink-2">Paragraph {v.index + 1}</p>
                <Marker verdict={v.verdict} />
              </div>
              <p className="mt-1">{result.paragraphs[v.index]?.text}</p>
              <p className={`${label} mt-3`}>Correct fact</p>
              <p className="mt-1">{v.correctFact}</p>
              {reasons.has(v.index) && (
                <>
                  <p className={`${label} mt-3`}>Your reason</p>
                  <p className="mt-1 italic">{reasons.get(v.index) || "No reason given."}</p>
                </>
              )}
              <p className={`${label} mt-3`}>Judgement</p>
              <p className="mt-1">{v.judgement}</p>
            </li>
          ))}
        </ol>
      </section>

      {result.falseAlarms && result.falseAlarms.length > 0 && (
        <section aria-labelledby="false-heading">
          <h2 id="false-heading" className="mb-3 text-xl">False alarms</h2>
          <ul className="border-t border-line">
            {result.falseAlarms.map((f) => (
              <li key={f.index} className="border-b border-line py-4">
                <p className="text-sm text-ink-2">Paragraph {f.index + 1} was correct</p>
                <p className="mt-1">{result.paragraphs[f.index]?.text}</p>
                <p className={`${label} mt-3`}>Your reason</p>
                <p className="mt-1 italic">{reasons.get(f.index) || "No reason given."}</p>
                <p className={`${label} mt-3`}>Why it is correct</p>
                <p className="mt-1">{f.note}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
