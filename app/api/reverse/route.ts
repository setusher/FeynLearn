import { generateStructured } from "@/lib/llm";
import { reverseGenerateInstructions, reverseJudgeInstructions } from "@/lib/prompts";
import { errorIndexes, reverseScore } from "@/lib/reverse";
import { clamp } from "@/lib/limits";
import { handleJson } from "@/lib/route";
import {
  ReverseGenerateModelSchema,
  ReverseJudgeModelSchema,
  ReverseRequestSchema,
  type ReverseGenerateResponse,
  type ReverseJudgeResponse,
} from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(req: Request) {
  return handleJson(req, ReverseRequestSchema, async (body): Promise<ReverseGenerateResponse | ReverseJudgeResponse> => {
    if (body.action === "generate") {
      const out = await generateStructured({
        schema: ReverseGenerateModelSchema,
        instructions: reverseGenerateInstructions(body),
        prompt: `Write the explanation of "${body.topic}" now.`,
        temperature: 0.8,
      });
      const known = new Set(body.concepts?.map((c) => c.id));
      return {
        paragraphs: out.paragraphs.map((p) => ({
          // Strip any leading "1." the model may add; the UI numbers paragraphs itself.
          text: clamp(p.text.trim().replace(/^\d+[.)]\s+/, "")),
          hasError: p.hasError,
          ...(p.hasError
            ? {
                errorNote: clamp(p.errorNote ?? "") || "This paragraph contains a planted error.",
                correctFact: clamp(p.correctFact || p.errorNote || ""),
                ...(p.conceptId && known.has(p.conceptId) ? { conceptId: p.conceptId } : {}),
              }
            : {}),
        })),
      };
    }

    // judge: decide "missed" and false alarms here; ask the model only about flagged paragraphs.
    const errors = errorIndexes(body.paragraphs);
    const flags = new Map(body.flags.filter((f) => f.index < body.paragraphs.length).map((f) => [f.index, f.reason]));
    const flaggedErrors = errors.filter((i) => flags.has(i));
    const falseAlarmIdx = [...flags.keys()].filter((i) => !body.paragraphs[i].hasError);

    let modelVerdicts = new Map<number, { verdict: "caught" | "partly"; judgement: string }>();
    let modelNotes = new Map<number, string>();
    if (flags.size > 0) {
      const listing = body.paragraphs
        .map((p, i) => {
          const lines = [`Paragraph ${i} ${p.hasError ? "[PLANTED ERROR]" : "[correct]"}: ${p.text}`];
          if (p.hasError) lines.push(`  What is wrong: ${p.errorNote ?? ""}`, `  Correct fact: ${p.correctFact ?? ""}`);
          if (flags.has(i)) lines.push(`  STUDENT FLAGGED, reason: ${flags.get(i) || "(no reason given)"}`);
          return lines.join("\n");
        })
        .join("\n\n");
      const out = await generateStructured({
        schema: ReverseJudgeModelSchema,
        instructions: reverseJudgeInstructions(body.topic),
        prompt: listing,
        temperature: 0.2,
      });
      modelVerdicts = new Map(out.verdicts.map((v) => [v.index, { verdict: v.verdict, judgement: v.judgement }]));
      modelNotes = new Map(out.falseAlarms.map((f) => [f.index, f.note]));
    }

    const verdicts = errors.map((i) => {
      const p = body.paragraphs[i];
      const correctFact = p.correctFact ?? "";
      if (!flaggedErrors.includes(i)) {
        return { index: i, verdict: "missed" as const, correctFact, judgement: "You did not flag this paragraph." };
      }
      const v = modelVerdicts.get(i);
      return {
        index: i,
        verdict: v?.verdict ?? ("partly" as const),
        correctFact,
        judgement: v?.judgement ?? "You flagged the right paragraph.",
      };
    });
    const falseAlarms = falseAlarmIdx.map((i) => ({
      index: i,
      note: modelNotes.get(i) ?? "This paragraph was correct.",
    }));

    return { verdicts, falseAlarms, score: reverseScore(verdicts, falseAlarms.length) };
  });
}
