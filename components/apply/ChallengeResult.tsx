import { rubricTotal } from "@/lib/challenges";
import type { Challenge } from "@/lib/types";

const label = "font-sans text-xs font-semibold uppercase tracking-wide text-ink-2";

/** Rubric table and model answer for a graded challenge. */
export function ChallengeResult({ challenge }: { challenge: Challenge }) {
  const rubric = challenge.rubric ?? [];
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-lg">Feedback</h3>
          <p className="tnum text-sm text-ink-2">
            Total <span className="font-serif text-2xl text-ink">{rubricTotal(rubric)}</span> / {rubric.length * 2}
          </p>
        </div>
        <table className="mt-2 w-full border-collapse text-left text-[15px]">
          <thead>
            <tr className="border-b border-line text-sm text-ink-2">
              <th scope="col" className="py-2 pr-4 font-medium">Criterion</th>
              <th scope="col" className="py-2 pr-4 text-right font-medium">Score</th>
              <th scope="col" className="hidden py-2 font-medium sm:table-cell">Feedback</th>
            </tr>
          </thead>
          <tbody>
            {rubric.map((r) => (
              <tr key={r.criterion} className="border-b border-line align-top">
                <td className="py-3 pr-4">
                  {r.criterion}
                  <p className="mt-1 text-sm text-ink-2 sm:hidden">{r.feedback}</p>
                </td>
                <td className="tnum whitespace-nowrap py-3 pr-4 text-right">{r.score} / 2</td>
                <td className="hidden py-3 text-ink-2 sm:table-cell">{r.feedback}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {challenge.modelAnswer && (
        <div>
          <p className={label}>Model answer sketch</p>
          <p className="mt-1 border-l-2 border-line pl-3">{challenge.modelAnswer}</p>
        </div>
      )}
    </div>
  );
}
