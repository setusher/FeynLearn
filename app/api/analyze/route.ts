import { coverageOf, sanitizeConcepts } from "@/lib/graph";
import { generateStructured } from "@/lib/llm";
import { analyzeInstructions } from "@/lib/prompts";
import { clamp, LIMITS } from "@/lib/limits";
import { handleJson } from "@/lib/route";
import { AnalyzeModelSchema, AnalyzeRequestSchema, type AnalyzeResponse } from "@/lib/schemas";

export const runtime = "nodejs";
// LLM calls take 2-30s; cap well inside Vercel's Hobby limit (300s) so a stuck call fails fast.
export const maxDuration = 60;

// Each misconception caps accuracy 15 points lower, whatever the model says.
const MISCONCEPTION_PENALTY = 15;

export async function POST(req: Request) {
  return handleJson(req, AnalyzeRequestSchema, async (body): Promise<AnalyzeResponse> => {
    const transcript = body.transcript
      .map((m) => `${m.role === "user" ? "STUDENT" : "LEARNER"}: ${m.text}`)
      .join("\n\n");

    const out = await generateStructured({
      schema: AnalyzeModelSchema,
      instructions: analyzeInstructions(body),
      prompt: `Transcript:\n\n${transcript}`,
      temperature: 0.2,
      thinking: "medium",
    });

    const concepts = sanitizeConcepts(
      out.concepts.map((c) => ({
        ...c,
        label: clamp(c.label, LIMITS.label),
        evidence: c.evidence.trim() || "not mentioned",
        note: c.note.trim(),
      })),
    );
    const accuracy = Math.round(
      Math.max(0, Math.min(out.accuracy, 100 - MISCONCEPTION_PENALTY * out.misconceptions.length)),
    );

    return {
      concepts,
      misconceptions: out.misconceptions,
      summary: out.summary.trim(),
      scores: { coverage: coverageOf(concepts), accuracy },
    };
  });
}
