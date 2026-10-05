import { GapMap } from "@/components/gapmap/GapMap";

export default async function GapMapPage({ searchParams }: PageProps<"/gap-map">) {
  const params = await searchParams;
  const topic = typeof params.topic === "string" ? params.topic : undefined;
  const session = typeof params.session === "string" ? params.session : undefined;
  return <GapMap key={`${topic ?? ""}|${session ?? ""}`} topicParam={topic} sessionParam={session} />;
}
