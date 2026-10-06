import { RUBRIC_CRITERIA } from "@/lib/schemas";
import type { RubricItem } from "@/lib/types";

const ABOUT: Record<string, string> = {
  "Uses the concept correctly": "The right idea, applied accurately.",
  "Reasoning is sound": "Clear cause-and-effect steps to the answer.",
  "Considers limits or edge cases": "Notes an assumption, limit or exception.",
};

/** The three criteria as 0-2 segmented bars with feedback (or descriptions before grading). */
export function RubricBars({ rubric }: { rubric?: RubricItem[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {RUBRIC_CRITERIA.map((criterion) => {
        const item = rubric?.find((r) => r.criterion === criterion);
        return (
          <li key={criterion}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px] font-semibold">{criterion}</span>
              <span className="tnum text-[12px] text-text-2">{item ? `${item.score} / 2` : "not scored"}</span>
            </div>
            <div className="mt-1 flex gap-1" role="img" aria-label={item ? `${criterion}: ${item.score} of 2` : `${criterion}: not scored yet`}>
              {[0, 1].map((i) => (
                <span key={i} className={`h-2 flex-1 rounded-[3px] ${item && i < item.score ? "bg-lime" : "bg-card-2"}`} />
              ))}
            </div>
            <p className="mt-1 text-[13px] text-text-2">{item?.feedback ?? ABOUT[criterion]}</p>
          </li>
        );
      })}
    </ul>
  );
}
