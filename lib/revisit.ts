import { PERSONAS, personaLabel, type PersonaId } from "./personas";
import type { RevisitAngle, Topic } from "./types";

// Each revisit comes at the topic from a different angle than the last time,
// rotating through these in order.
export const ANGLES: RevisitAngle[] = ["persona", "analogy", "apply", "reverse"];

export function nextAngle(last: RevisitAngle | undefined): RevisitAngle {
  if (!last) return ANGLES[0];
  return ANGLES[(ANGLES.indexOf(last) + 1) % ANGLES.length];
}

/** A persona different from the one used last time. */
export function nextPersona(last: string | undefined): PersonaId {
  const idx = PERSONAS.findIndex((p) => p.id === last);
  return PERSONAS[(idx + 1) % PERSONAS.length].id;
}

export type RevisitPlan = { angle: RevisitAngle; description: string; href: string };

export function revisitPlan(topic: Topic, lastPersona: string | undefined): RevisitPlan {
  const angle = nextAngle(topic.lastAngle);
  const name = encodeURIComponent(topic.name);
  switch (angle) {
    case "persona": {
      const persona = nextPersona(lastPersona);
      return {
        angle,
        description: `This time: explain it to a ${personaLabel(persona).toLowerCase()}.`,
        href: `/session?topic=${name}&mode=explain&persona=${persona}`,
      };
    }
    case "analogy":
      return {
        angle,
        description: "This time: explain it through an analogy from everyday life.",
        href: `/session?topic=${name}&mode=explain&persona=${PERSONAS.some((p) => p.id === lastPersona) ? lastPersona : "child"}&angle=analogy`,
      };
    case "apply":
      return {
        angle,
        description: "This time: use it to solve a realistic scenario.",
        href: `/apply?topic=${encodeURIComponent(topic.id)}`,
      };
    case "reverse":
      return {
        angle,
        description: "This time: find the mistakes in someone else's explanation.",
        href: `/session?topic=${name}&mode=reverse`,
      };
  }
}
