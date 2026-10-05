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
  angle: z.enum(["analogy"]).optional(),
  history: z
    .array(z.object({ role: z.enum(["user", "ai"]), text: z.string().max(LIMITS.generated) }))
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

const TurnSchema = z.object({ role: z.enum(["user", "ai"]), text: z.string().max(LIMITS.generated) });

export const AnalyzeRequestSchema = z.object({
  topic: z.string().trim().min(1).max(LIMITS.topic),
  transcript: z.array(TurnSchema).min(1).max(LIMITS.history + 2),
  notesExcerpt: z.string().max(LIMITS.notes).optional(),
  focus: z.string().max(LIMITS.topic).optional(),
  /** Concepts from the previous analysis of this topic, so attempts can be compared node by node. */
  previousConcepts: z
    .array(z.object({ id: z.string().max(60), label: z.string().max(LIMITS.label) }))
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

// ---- /api/reverse ----

export const DIFFICULTIES = ["obvious", "moderate", "subtle"] as const;

const ParagraphSchema = z.object({
  text: z.string().max(LIMITS.generated),
  hasError: z.boolean(),
  errorNote: z.string().max(LIMITS.generated).optional(),
  correctFact: z.string().max(LIMITS.generated).optional(),
  conceptId: z.string().max(60).optional(),
});

export const ReverseRequestSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("generate"),
    topic: z.string().trim().min(1).max(LIMITS.topic),
    difficulty: z.enum(DIFFICULTIES),
    notesExcerpt: z.string().max(LIMITS.notes).optional(),
    concepts: z
      .array(z.object({ id: z.string().max(60), label: z.string().max(LIMITS.label) }))
      .max(8)
      .optional(),
  }),
  z.object({
    action: z.literal("judge"),
    topic: z.string().trim().min(1).max(LIMITS.topic),
    paragraphs: z.array(ParagraphSchema).min(1).max(8),
    flags: z.array(z.object({ index: z.number().int().min(0).max(7), reason: z.string().max(1000) })).max(8),
  }),
]);
export type ReverseRequest = z.infer<typeof ReverseRequestSchema>;

export const ReverseGenerateModelSchema = z
  .object({
    paragraphs: z
      .array(
        z.object({
          text: z.string().describe("One paragraph of 2-4 sentences. No meta text about errors."),
          hasError: z.boolean().describe("True if this paragraph contains a planted error"),
          errorNote: z.string().optional().describe("If hasError: what exactly is wrong"),
          correctFact: z.string().optional().describe("If hasError: the correct statement, one sentence"),
          conceptId: z.string().optional().describe("If hasError and concepts were given: the related concept id"),
        }),
      )
      .min(5)
      .max(7),
  })
  .refine((v) => {
    const errors = v.paragraphs.filter((p) => p.hasError).length;
    return errors >= 1 && errors <= 3;
  }, "Explanation must contain 1 to 3 planted errors");
export type ReverseGenerateResponse = { paragraphs: z.infer<typeof ParagraphSchema>[] };

export const ReverseJudgeModelSchema = z.object({
  verdicts: z.array(
    z.object({
      index: z.number().int().describe("Paragraph index (0-based) of a planted error the student flagged"),
      verdict: z.enum(["caught", "partly"]).describe("caught: reason identifies the error; partly: right paragraph, vague or partly wrong reason"),
      judgement: z.string().describe("One sentence on the student's reasoning, addressed as 'you'"),
    }),
  ),
  falseAlarms: z.array(
    z.object({
      index: z.number().int().describe("Paragraph index (0-based) the student flagged that had no planted error"),
      note: z.string().describe("One sentence on why this paragraph is actually correct"),
    }),
  ),
});

export type ReverseJudgeResponse = {
  verdicts: { index: number; verdict: "caught" | "partly" | "missed"; correctFact: string; judgement: string }[];
  falseAlarms: { index: number; note: string }[];
  score: number;
};

// ---- /api/challenge ----

export const RUBRIC_CRITERIA = [
  "Uses the concept correctly",
  "Reasoning is sound",
  "Considers limits or edge cases",
] as const;

export const ChallengeRequestSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("generate"),
    topic: z.string().trim().min(1).max(LIMITS.topic),
    notesExcerpt: z.string().max(LIMITS.notes).optional(),
    /** Earlier scenarios for this topic, so a new one is different. */
    avoid: z.array(z.string().max(LIMITS.generated)).max(5).optional(),
    focus: z.string().max(LIMITS.topic).optional(),
  }),
  z.object({
    action: z.literal("grade"),
    topic: z.string().trim().min(1).max(LIMITS.topic),
    scenario: z.string().min(1).max(LIMITS.generated),
    answer: z.string().trim().min(1).max(4000),
    notesExcerpt: z.string().max(LIMITS.notes).optional(),
  }),
]);
export type ChallengeRequest = z.infer<typeof ChallengeRequestSchema>;

export const ChallengeScenarioSchema = z.object({
  scenario: z
    .string()
    .describe("3-6 sentences, a concrete real-world situation with names and numbers, ending with a question"),
});
export type ChallengeGenerateResponse = z.infer<typeof ChallengeScenarioSchema>;

export const ChallengeGradeSchema = z.object({
  rubric: z
    .array(
      z.object({
        criterion: z.enum(RUBRIC_CRITERIA),
        score: z.number().int().min(0).max(2),
        feedback: z.string().describe("One sentence of specific feedback, addressed as 'you'"),
      }),
    )
    .length(3),
  modelAnswer: z.string().describe("A short model answer sketch, 3-5 sentences"),
});
export type ChallengeGradeResponse = {
  rubric: { criterion: string; score: 0 | 1 | 2; feedback: string }[];
  modelAnswer: string;
};
