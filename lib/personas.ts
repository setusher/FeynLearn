export const PERSONAS = [
  { id: "child", label: "Curious 10-year-old" },
  { id: "friend", label: "Skeptical friend" },
  { id: "professor", label: "Strict professor" },
] as const;

export type PersonaId = (typeof PERSONAS)[number]["id"];

export function personaLabel(id: string | undefined): string {
  return PERSONAS.find((p) => p.id === id)?.label ?? PERSONAS[0].label;
}

export function isPersonaId(id: string | null | undefined): id is PersonaId {
  return PERSONAS.some((p) => p.id === id);
}
