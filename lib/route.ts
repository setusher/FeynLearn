import type { z } from "zod";
import { LLMError } from "./llm";
import { clientIp, rateLimited } from "./rateLimit";

// Shared wrapper for API routes: rate limit, JSON parsing, request validation
// and error mapping. Errors always come back as { error: string }.

const STATUS: Record<LLMError["kind"], number> = {
  config: 500,
  busy: 429,
  output: 502,
  upstream: 502,
};

export async function handleJson<S extends z.ZodType>(
  req: Request,
  schema: S,
  run: (body: z.infer<S>) => Promise<unknown>,
): Promise<Response> {
  if (rateLimited(clientIp(req.headers))) {
    return Response.json(
      { error: "Too many requests. Wait a minute and try again." },
      { status: 429 },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const where = first?.path.length ? ` (${first.path.join(".")})` : "";
    return Response.json({ error: `Invalid request${where}: ${first?.message ?? "bad input"}` }, { status: 400 });
  }

  try {
    return Response.json(await run(parsed.data));
  } catch (err) {
    if (err instanceof LLMError) {
      // Log the kind only; messages never contain the key, but keep logs minimal.
      console.error(`[api] ${new URL(req.url).pathname} failed: ${err.kind}`);
      return Response.json({ error: err.message }, { status: STATUS[err.kind] });
    }
    console.error(`[api] ${new URL(req.url).pathname} failed: unexpected`);
    return Response.json({ error: "Something went wrong on the server. Please try again." }, { status: 500 });
  }
}
