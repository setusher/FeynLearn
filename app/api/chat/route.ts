import type { ModelMessage } from "ai";
import { generateStructured } from "@/lib/llm";
import type { PersonaId } from "@/lib/personas";
import { explainInstructions } from "@/lib/prompts";
import { handleJson } from "@/lib/route";
import { ChatRequestSchema, ChatResponseSchema, type ChatResponse } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(req: Request) {
  return handleJson(req, ChatRequestSchema, async (body): Promise<ChatResponse> => {
    const messages: ModelMessage[] = [
      ...body.history.map(
        (m): ModelMessage =>
          m.role === "user" ? { role: "user", content: m.text } : { role: "assistant", content: m.text },
      ),
      { role: "user", content: body.userMessage },
    ];
    // The transcript opens with the learner's line; Gemini expects a user turn first.
    if (messages[0].role === "assistant") {
      messages.unshift({ role: "user", content: `I'm ready to explain "${body.topic}".` });
    }
    const turn = body.history.filter((m) => m.role === "user").length + 1;

    const out = await generateStructured({
      schema: ChatResponseSchema,
      instructions: explainInstructions({
        persona: body.persona as PersonaId,
        topic: body.topic,
        turn,
        focus: body.focus,
        angle: body.angle,
        notesExcerpt: body.notesExcerpt,
      }),
      messages,
      thinking: "low",
    });
    return { reply: out.reply.trim(), misconception: out.misconception };
  });
}
