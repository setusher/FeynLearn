import { ApplyIt } from "@/components/apply/ApplyIt";

export default async function ApplyPage({ searchParams }: PageProps<"/apply">) {
  const params = await searchParams;
  const topic = typeof params.topic === "string" ? params.topic : undefined;
  const focus = typeof params.focus === "string" ? params.focus.slice(0, 200) : undefined;
  return <ApplyIt key={topic ?? ""} topicParam={topic} focus={focus} autoNew={params.new === "1"} />;
}
