import { z } from "zod";
import { LIMITS } from "./limits";
import { PERSONAS } from "./personas";

// Request and response schemas shared by API routes and the client.

const personaIds = PERSONAS.map((p) => p.id) as [string, ...string[]];

export const MisconceptionSchema = z.object({
  name: z.string().describe("Short name of the misconception, 2-6 words"),
  correction: z.string().describe("One-sentence correction of the misconception"),
});

// ---- /api/chat ----

export const ChatRequestSchema = z.object({
  topic: z.string().trim().min(1).max(LIMITS.topic),
  persona: z.enum(personaIds),
  notesExcerpt: z.string().max(LIMITS.notes).optional(),
  focus: z.string().max(LIMITS.topic).optional(),
  history: z
    .array(z.object({ role: z.enum(["user", "ai"]), text: z.string().max(LIMITS.message) }))
    .max(LIMITS.history),
  userMessage: z.string().trim().min(1).max(LIMITS.message),
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export const ChatResponseSchema = z.object({
  reply: z.string().min(1).describe("Your in-character reply: at most one short question"),
  misconception: MisconceptionSchema.nullable().describe(
    "Set only if the student's latest message states something factually wrong; otherwise null",
  ),
});
export type ChatResponse = z.infer<typeof ChatResponseSchema>;
