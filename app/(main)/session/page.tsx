import { SessionRoute, type SessionParams } from "@/components/sessionbox/SessionRoute";
import { LIMITS } from "@/lib/limits";

function param(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v?.trim() || undefined;
}

export default async function SessionPage({ searchParams }: PageProps<"/session">) {
  const p = await searchParams;
  const params: SessionParams = {
    topic: param(p.topic)?.slice(0, LIMITS.topic),
    mode: param(p.mode),
    persona: param(p.persona),
    difficulty: param(p.difficulty),
    focus: param(p.focus)?.slice(0, LIMITS.topic),
    angle: param(p.angle),
    sid: param(p.sid),
  };
  return <SessionRoute key={JSON.stringify(params)} params={params} />;
}
