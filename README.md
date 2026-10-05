# FeynLearn

FeynLearn helps students move beyond memorization by making them teach a concept. You explain a
topic to a simulated learner who knows nothing about it; FeynLearn then maps which parts of your
understanding are solid, shaky or missing, asks you to catch planted mistakes, gives you realistic
scenarios to apply the idea, and brings topics back on a spaced schedule from a new angle.

No login. All user data lives in the browser (IndexedDB). The only server code is a set of API
routes that call the LLM so the API key stays secret.

The full product spec is in [`BUILD_SPEC.md`](./BUILD_SPEC.md).

## Setup

```bash
npm i
cp .env.example .env.local   # then add your key
npm run dev                  # http://localhost:3000
```

Other scripts: `npm run build`, `npm run lint`, `npm test` (Vitest).

## Environment variables

| Name             | Required | Notes                                                        |
| ---------------- | -------- | ------------------------------------------------------------ |
| `GEMINI_API_KEY` | Yes      | Google AI Studio key (free tier works). Server-side only.    |
| `GEMINI_MODEL`   | No       | Main model. Default `gemini-3.8-flash`.                      |
| `GEMINI_FALLBACK_MODEL` | No | Used when the main model is overloaded or rate limited. Default `gemini-3.5-flash-lite`. |

## Deploy to Vercel

1. Push this folder to a Git repository.
2. In Vercel, "Add New Project" and import the repository. If the repo root is not this folder,
   set "Root Directory" to `FeynLearn`.
3. Add `GEMINI_API_KEY` under Settings > Environment Variables.
4. Deploy. No other configuration, database or paid service is needed.

## Build status

- [x] Phase 1: shell, theme, sidebar layout, route stubs, dashboard with sample data and empty state
- [x] Phase 2: Explain mode
- [ ] Phase 3: Analyze and Gap map
- [ ] Phase 4: Catch the mistake
- [ ] Phase 5: Apply it, Understanding, Revisit, Notes
- [ ] Phase 6: Voice and polish
- [ ] Phase 7: Design audit

## Decisions

- **Project location:** the app lives in its own `FeynLearn/` folder, because the parent folder
  holds unrelated Python tooling guidelines.
- **Versions:** Next.js 16 (App Router), React 19, Tailwind CSS 4, AI SDK 7, Zod 4, Dexie 4,
  Zustand 5, Vitest 5. Tailwind 4 keeps the theme tokens in `app/globals.css` (`@theme`) instead of
  a `tailwind.config.ts`.
- **Fonts:** Newsreader for headings and large numerals, IBM Plex Sans for UI text.
- **Settings** is a page at `/settings`, linked from the sidebar footer. Clearing data asks for an
  inline confirmation instead of opening a modal.
- **Sample data** adds two topics ("Why do seasons happen?" with two explain attempts, one
  catch-the-mistake round and one challenge; plus a short vaccines topic) so the dashboard, Gap
  map comparison and charts are populated. It is stored like any other data and removed by
  "Clear all data".
- **Spaced review:** scores below 50 reset the interval to 1 day, 50-69 repeat the current
  interval, 70+ advance through 1, 3, 7, 14, 30 days, then grow by the SM-2 ease factor.
- **Top bar topic** reflects the topic typed in "Start a session" or the active session.
- **Structured output:** AI SDK 7 deprecates `generateObject`, so `lib/llm.ts` uses
  `generateText` with `Output.object({ schema })`. Output is validated with Zod, retried once if
  malformed, then reported as a plain error message.
- **Models:** `gemini-2.5-flash` is no longer available to new API keys, so the default is
  `gemini-3.8-flash`. Because free-tier models are often overloaded (HTTP 503) and quotas are per
  model, a failed call is retried once on `gemini-3.5-flash-lite` before showing an error.
- **Chat replies are not streamed.** The reply and the misconception flag arrive together as one
  JSON object, which keeps the callout in sync with its message.
- **Sessions are saved on the first message**, not when the page opens, so browsing to
  `/session` never leaves empty records. The session id is added to the URL so a refresh resumes
  the conversation. Discarding a session also removes its topic if nothing else uses it.
- **Switching modes mid-session** asks first, then keeps the conversation as an unfinished session.
- **Rate limit:** 20 API requests per minute per IP, in memory.
- **Next.js dev badge** is turned off (`devIndicators: false`) because it floats over the sidebar.

## Known limitations

- Data is per browser. Clearing site data or switching devices loses it (use Settings > Export).
- Gemini's free tier allows only a few requests per minute and models are sometimes overloaded;
  the app shows a "try again" message when both models are unavailable.
- The per-IP rate limit is in memory and best-effort; it resets whenever the serverless function
  restarts.
