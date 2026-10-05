"use client";

import { useRouter } from "next/navigation";
import { formatDate, relativeDay } from "@/lib/format";
import type { Session, Topic } from "@/lib/types";

export type TopicRow = { topic: Topic; lastSession?: Session; score: number | null };

export function RecentTopics({ rows, now }: { rows: TopicRow[]; now: number }) {
  const router = useRouter();

  if (rows.length === 0) {
    return (
      <p className="text-ink-2">
        No sessions yet. Pick a topic above and explain it in your own words.
      </p>
    );
  }

  const open = (id: string) => router.push(`/gap-map?topic=${encodeURIComponent(id)}`);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-[15px]">
        <thead>
          <tr className="border-b border-line text-sm text-ink-2">
            <th scope="col" className="py-2 pr-4 font-medium">Topic</th>
            <th scope="col" className="hidden py-2 pr-4 font-medium sm:table-cell">Last session</th>
            <th scope="col" className="py-2 pr-4 text-right font-medium">Score</th>
            <th scope="col" className="py-2 font-medium">Next review</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ topic, lastSession, score }) => (
            <tr
              key={topic.id}
              onClick={() => open(topic.id)}
              className="cursor-pointer border-b border-line transition-colors duration-150 hover:bg-surface"
            >
              <td className="py-3 pr-4">
                <a
                  href={`/gap-map?topic=${encodeURIComponent(topic.id)}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    open(topic.id);
                  }}
                  className="text-ink no-underline hover:underline"
                >
                  {topic.name}
                </a>
              </td>
              <td className="tnum hidden py-3 pr-4 text-ink-2 sm:table-cell">{formatDate(lastSession?.startedAt)}</td>
              <td className="tnum py-3 pr-4 text-right">{score ?? "-"}</td>
              <td className="tnum py-3 text-ink-2">{relativeDay(topic.nextReview, now)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
