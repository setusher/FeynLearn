import { PageHeader } from "@/components/ui/PageHeader";
import { personaLabel } from "@/lib/personas";

export default async function SessionPage({ searchParams }: PageProps<"/session">) {
  const params = await searchParams;
  const topic = typeof params.topic === "string" ? params.topic : "";
  const mode = params.mode === "reverse" ? "Catch the mistake" : "Explain";
  const persona = typeof params.persona === "string" ? params.persona : undefined;

  return (
    <div className="max-w-[960px]">
      <PageHeader
        title={topic || "New session"}
        intro={
          mode === "Explain"
            ? `Explain mode, talking to a ${personaLabel(persona).toLowerCase()}. The chat arrives in phase 2.`
            : "Catch the mistake mode. Arrives in phase 4."
        }
      />
    </div>
  );
}
