import { StartSession } from "@/components/dashboard/StartSession";
import { SessionView } from "@/components/session/SessionView";
import { PageHeader } from "@/components/ui/PageHeader";
import { isPersonaId } from "@/lib/personas";
import { LIMITS } from "@/lib/limits";

function param(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v?.trim() || undefined;
}

export default async function SessionPage({ searchParams }: PageProps<"/session">) {
  const params = await searchParams;
  const topic = param(params.topic)?.slice(0, LIMITS.topic);
  const persona = param(params.persona);

  if (!topic) {
    return (
      <div className="max-w-[720px]">
        <PageHeader title="New session" intro="Pick a topic and a way to practise it." />
        <StartSession hasNotes={false} />
      </div>
    );
  }

  return (
    <SessionView
      key={`${topic}|${param(params.sid) ?? ""}`}
      topic={topic}
      mode={param(params.mode) === "reverse" ? "reverse" : "explain"}
      persona={isPersonaId(persona) ? persona : "child"}
      sid={param(params.sid)}
      focus={param(params.focus)?.slice(0, LIMITS.topic)}
      angle={param(params.angle) === "analogy" ? "analogy" : undefined}
    />
  );
}
