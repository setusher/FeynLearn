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

// ---- /api/analyze ----

const TurnSchema = z.object({ role: z.enum(["user", "ai"]), text: z.string().max(LIMITS.message) });

export const AnalyzeRequestSchema = z.object({
  topic: z.string().trim().min(1).max(LIMITS.topic),
  transcript: z.array(TurnSchema).min(1).max(LIMITS.history + 2),
  notesExcerpt: z.string().max(LIMITS.notes).optional(),
  focus: z.string().max(LIMITS.topic).optional(),
  /** Concepts from the previous analysis of this topic, so attempts can be compared node by node. */
  previousConcepts: z
    .array(z.object({ id: z.string().max(60), label: z.string().max(120) }))
    .max(8)
    .optional(),
});
export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

export const AnalyzeModelSchema = z.object({
  concepts: z
    .array(
      z.object({
        id: z.string().describe("Short kebab-case id, e.g. 'axial-tilt'. Reuse previous ids for the same idea."),
        label: z.string().describe("The concept stated as a short claim, max 8 words"),
        status: z.enum(["solid", "shaky", "missing"]),
        evidence: z
          .string()
          .describe("A short verbatim quote from the student's messages, or exactly 'not mentioned'"),
        note: z.string().describe("One sentence explaining the status"),
        dependsOn: z.array(z.string()).describe("Ids of concepts this one requires; must not form cycles"),
      }),
    )
    .min(5)
    .max(8),
  misconceptions: z.array(MisconceptionSchema).max(6),
  summary: z.string().describe("2-3 sentences addressed to the student as 'you'"),
  accuracy: z
    .number()
    .min(0)
    .max(100)
    .describe("0-100: how factually correct the student's statements were"),
});

export type AnalyzeResponse = {
  concepts: {
    id: string;
    label: string;
    status: "solid" | "shaky" | "missing";
    evidence: string;
    note: string;
    dependsOn: string[];
  }[];
  misconceptions: { name: string; correction: string }[];
  summary: string;
  scores: { coverage: number; accuracy: number };
};
