import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";
import { relativeDay } from "@/lib/format";
import type { Topic } from "@/lib/types";

export function DueList({ topics, now }: { topics: Topic[]; now: number }) {
  if (topics.length === 0) {
    return <p className="text-ink-2">Nothing is due. Topics come back here on a spaced schedule.</p>;
  }
  return (
    <ul className="border-t border-line">
      {topics.map((t) => (
        <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-3">
          <div>
            <p>{t.name}</p>
            <p className="tnum text-sm text-ink-2">Due {relativeDay(t.nextReview, now).toLowerCase()}</p>
          </div>
          <Link href={`/revisit?topic=${encodeURIComponent(t.id)}`} className={buttonClass("secondary")}>
            Revisit
          </Link>
        </li>
      ))}
    </ul>
  );
}
