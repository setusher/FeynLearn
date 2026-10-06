"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Box } from "@/components/ui/Box";
import { SampleChip, StatusMark } from "@/components/ui/Chip";
import { Working } from "@/components/ui/Working";
import { finishedAt, isAnalyzed, type DashData } from "./types";

const MiniGraph = dynamic(() => import("@/components/gapmap/MiniGraph"), {
  ssr: false,
  loading: () => <Working label="Drawing map..." />,
});

export function GapMapBox({ data }: { data: DashData }) {
  const latest = [...data.sessions].filter(isAnalyzed).sort((a, b) => finishedAt(b) - finishedAt(a))[0];
  const topic = data.topics.find((t) => t.id === latest?.topicId);
  const concepts = latest?.concepts ?? [];
  const count = (s: "solid" | "shaky" | "missing") => concepts.filter((c) => c.status === s).length;

  return (
    <Box
      id="gapmap"
      title="Gap map"
      href={topic ? `/gap-map?topic=${encodeURIComponent(topic.id)}` : "/gap-map"}
      className="area-e"
      extra={topic?.sample ? <SampleChip /> : undefined}
      bodyClassName="gap-2"
    >
      {!latest || !topic ? (
        <p className="text-[13px] text-text-2">
          Finish a session and choose End and analyze to see which ideas are solid, shaky or missing.
        </p>
      ) : (
        <>
          <p className="truncate text-[13px] text-text-2">{topic.name}</p>
          <div className="min-h-[110px] flex-1 rounded-[12px] border border-line bg-bg">
            <MiniGraph concepts={concepts} label={`Concept map for ${topic.name}`} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] font-semibold text-text-2">
            <span className="flex flex-wrap gap-3">
              <StatusMark status="solid" label={`${count("solid")} solid`} />
              <StatusMark status="shaky" label={`${count("shaky")} shaky`} />
              <StatusMark status="missing" label={`${count("missing")} missing`} />
            </span>
            <Link href={`/gap-map?topic=${encodeURIComponent(topic.id)}`} className="font-semibold">
              Open gap map
            </Link>
          </div>
        </>
      )}
    </Box>
  );
}
