import { createGoogle } from "@ai-sdk/google";
import { APICallError, generateText, NoObjectGeneratedError, Output, RetryError, type ModelMessage } from "ai";
import type { z } from "zod";

// The single place that knows which LLM provider and model FeynLearn uses.
// To switch to Groq later: install @ai-sdk/groq, build the model with
// createGroq({ apiKey: process.env.GROQ_API_KEY }) below, and update the model IDs.
// Server-only: never import this from a client component.

export const MODEL_ID = process.env.GEMINI_MODEL || "gemini-3.8-flash";
/** Tried when the main model is overloaded, rate limited or unavailable. Free-tier limits are per model. */
export const FALLBACK_MODEL_ID = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.5-flash-lite";

function getModel(id: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new LLMError("config", "The server is missing its AI key (GEMINI_API_KEY).");
  return createGoogle({ apiKey })(id);
}

export type LLMErrorKind = "config" | "busy" | "output" | "upstream";

export class LLMError extends Error {
  constructor(
    public kind: LLMErrorKind,
    message: string,
    /** True when another model might succeed (overload, per-model quota, model retired). */
    public tryOtherModel = false,
  ) {
    super(message);
    this.name = "LLMError";
  }
}

type StructuredArgs<S extends z.ZodType> = {
  schema: S;
  instructions: string;
  temperature?: number;
  /** How much the model reasons before answering. Lower is faster. Not every model accepts "minimal". */
  thinking?: "minimal" | "low" | "medium" | "high";
} & ({ prompt: string; messages?: never } | { messages: ModelMessage[]; prompt?: never });

/**
 * Ask the model for JSON matching `schema`. The SDK validates against the Zod
 * schema; if the output is missing or invalid we retry once, then give up with
 * an LLMError carrying a message that is safe to show to the user.
 */
export async function generateStructured<S extends z.ZodType>(
  args: StructuredArgs<S>,
): Promise<z.infer<S>> {
  const models = [...new Set([MODEL_ID, FALLBACK_MODEL_ID])];
  let lastError: LLMError | undefined;
  for (const id of models) {
    try {
      const out = await generateWithModel(id, args);
      if (process.env.NODE_ENV !== "production") console.info("[llm] answered by", id);
      return out;
    } catch (err) {
      lastError = err instanceof LLMError ? err : classify(err, id);
      if (!lastError.tryOtherModel) throw lastError;
    }
  }
  throw lastError ?? new LLMError("upstream", "Could not reach the AI service. Please try again.");
}

async function generateWithModel<S extends z.ZodType>(
  modelId: string,
  args: StructuredArgs<S>,
): Promise<z.infer<S>> {
  const { schema, instructions, temperature = 0.7, thinking = "low" } = args;
  const common = {
    model: getModel(modelId),
    instructions,
    temperature,
    maxRetries: 1,
    output: Output.object({ schema }),
    providerOptions: { google: { thinkingConfig: { thinkingLevel: thinking } } },
  };

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = args.messages
        ? await generateText({ ...common, messages: args.messages })
        : await generateText({ ...common, prompt: args.prompt as string });
      const parsed = schema.safeParse(result.output);
      if (parsed.success) return parsed.data;
    } catch (err) {
      const mapped = classify(err, modelId);
      // Only malformed output is worth a second try on the same model.
      if (mapped.kind !== "output") throw mapped;
    }
  }
  throw new LLMError("output", "The AI gave an answer we could not read. Please try again.");
}

function classify(err: unknown, modelId: string): LLMError {
  if (err instanceof LLMError) return err;
  if (process.env.NODE_ENV !== "production") {
    // Dev-only detail. Provider errors never include the API key (it is sent as a header).
    const e = err as { name?: string; message?: string; statusCode?: number; lastError?: { message?: string; statusCode?: number } };
    console.error("[llm]", modelId, e.name, e.statusCode ?? e.lastError?.statusCode ?? "", (e.lastError?.message ?? e.message ?? "").slice(0, 400));
  }
  if (NoObjectGeneratedError.isInstance(err)) {
    return new LLMError("output", "The AI gave an answer we could not read.");
  }
  const cause = RetryError.isInstance(err) ? err.lastError : err;
  if (APICallError.isInstance(cause)) {
    if (cause.statusCode === 429) {
      return new LLMError("busy", "The AI service is at its free-tier limit right now. Wait a minute and try again.", true);
    }
    if (cause.statusCode === 503) {
      return new LLMError("busy", "The AI model is overloaded right now. Try again in a moment.", true);
    }
    if (cause.statusCode === 404) {
      return new LLMError("config", `The AI model "${modelId}" is not available for this key. Set GEMINI_MODEL to a current model.`, true);
    }
    if (cause.statusCode === 400 || cause.statusCode === 401 || cause.statusCode === 403) {
      return new LLMError("config", "The AI service rejected the request. Check that GEMINI_API_KEY is valid.");
    }
  }
  return new LLMError("upstream", "Could not reach the AI service. Check your connection and try again.");
}
