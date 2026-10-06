import { Notes } from "@/components/notes/Notes";

export default async function NotesPage({ searchParams }: PageProps<"/notes">) {
  const params = await searchParams;
  const topic = typeof params.topic === "string" ? params.topic.trim().slice(0, 200) : undefined;
  return <Notes forTopic={topic || undefined} />;
}
