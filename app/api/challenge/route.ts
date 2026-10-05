import { generateStructured } from "@/lib/llm";
import { challengeGenerateInstructions, challengeGradeInstructions } from "@/lib/prompts";
import { clamp } from "@/lib/limits";
import { handleJson } from "@/lib/route";
import {
  ChallengeGradeSchema,
  ChallengeRequestSchema,
  ChallengeScenarioSchema,
  RUBRIC_CRITERIA,
  type ChallengeGenerateResponse,
  type ChallengeGradeResponse,
} from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(req: Request) {
  return handleJson(req, ChallengeRequestSchema, async (body): Promise<ChallengeGenerateResponse | ChallengeGradeResponse> => {
    if (body.action === "generate") {
      const out = await generateStructured({
        schema: ChallengeScenarioSchema,
        instructions: challengeGenerateInstructions(body),
        prompt: `Write the scenario about "${body.topic}" now.`,
        temperature: 0.9,
      });
      return { scenario: clamp(out.scenario) };
    }

    const out = await generateStructured({
      schema: ChallengeGradeSchema,
      instructions: challengeGradeInstructions(body.topic, body.notesExcerpt),
      prompt: `Scenario:\n${body.scenario}\n\nStudent's answer:\n${body.answer}`,
      temperature: 0.2,
    });
    // Always return the three criteria in the documented order.
    const rubric = RUBRIC_CRITERIA.map((criterion) => {
      const item = out.rubric.find((r) => r.criterion === criterion);
      return {
        criterion,
        score: (item?.score ?? 0) as 0 | 1 | 2,
        feedback: item?.feedback.trim() ?? "No feedback returned for this criterion.",
      };
    });
    return { rubric, modelAnswer: out.modelAnswer.trim() };
  });
}
