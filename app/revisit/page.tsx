import { Revisit } from "@/components/revisit/Revisit";

export default async function RevisitPage({ searchParams }: PageProps<"/revisit">) {
  const params = await searchParams;
  return <Revisit highlight={typeof params.topic === "string" ? params.topic : undefined} />;
}
