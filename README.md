# FeynLearn

FeynLearn helps students move beyond memorization by making them teach a concept. You explain a
topic to a simulated learner who knows nothing about it; FeynLearn then maps which parts of your
understanding are solid, shaky or missing, asks you to catch planted mistakes, gives you realistic
scenarios to apply the idea, and brings topics back on a spaced schedule from a new angle.

No login. All user data lives in the browser (IndexedDB). The only server code is a set of API
routes that call the LLM so the API key stays secret.

The full product spec is in [`BUILD_SPEC.md`](./BUILD_SPEC.md).

## What you can do

| Goal | Feature | Where |
| --- | --- | --- |
| Understand | **Explain** a topic to a curious 10-year-old, a skeptical friend or a strict professor. The learner asks one question at a time and flags misconceptions inline. Voice input and read-aloud are available where the browser supports them. | `/session` |
| Understand | **Catch the mistake**: read an explanation with 1-3 planted errors, flag them, then see what you caught, missed or flagged wrongly. | `/session` (toggle) |
| Connect | **Gap map**: after a session, a graph of 5-8 key concepts marked solid, shaky or missing, with your own words as evidence and a before/after comparison. | `/gap-map` |
| Connect | **Revisit**: spaced review (1, 3, 7, 14, 30 days) that comes back from a different angle each time. | `/revisit` |
| Apply | **Apply it**: a realistic scenario, a 3-criterion rubric and a model answer. | `/apply` |
| Track | **Understanding**: overall score, score over time per topic, and a per-topic table. | `/understanding` |
| Ground | **Notes**: upload PDF/TXT or paste text; linked notes become the reference for every AI request on that topic. | `/notes` |

First run: press "Try a sample topic" on the dashboard to load "Why do seasons happen?" with past
attempts, so the Gap map comparison and charts have something to show. Settings (sidebar footer)
exports everything as JSON or clears all data, including the sample.

## Project layout

```
app/                 routes; app/api/{chat,analyze,reverse,challenge}/route.ts are the only server code
components/          UI by area (shell, dashboard, session, gapmap, apply, understanding, revisit, notes, ui)
lib/llm.ts           the one place that knows the provider and model (swap to Groq here)
lib/prompts.ts       every LLM prompt
lib/schemas.ts       Zod schemas for requests and model output
lib/db.ts            Dexie (IndexedDB) tables; lib/types.ts is the data model
lib/score.ts         understanding score formula      lib/sm2.ts  spaced-review scheduler
lib/graph.ts         concept graph cleanup and Catch-the-mistake evidence
lib/notes.ts         note excerpt selection           lib/speech.ts  Web Speech helpers
tests/               Vitest unit tests (scheduler, score, graph, history, revisit, notes)
```

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

Each API route sets `maxDuration = 60` (seconds). AI calls usually take 2-30 seconds; this is well
inside the Hobby plan limit and stops a stuck call from running for minutes.

## Build status

- [x] Phase 1: shell, theme, sidebar layout, route stubs, dashboard with sample data and empty state
- [x] Phase 2: Explain mode
- [x] Phase 3: Analyze and Gap map
- [x] Phase 4: Catch the mistake
- [x] Phase 5: Apply it, Understanding, Revisit, Notes
- [x] Phase 6: Voice and polish
- [x] Phase 7: Design audit

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
- **Analysis scores:** coverage is computed from the concept statuses (solid = 1, shaky = 0.5,
  missing = 0, averaged), not taken from the model, so it always matches the map. Accuracy comes
  from the model but is capped 15 points lower for each misconception it lists.
- **Comparable attempts:** when a topic was analyzed before, its concept ids and labels are sent
  with the new analysis and the model is asked to reuse them, so the Gap map can show
  "was missing" / "was shaky" per node. Concepts are matched by id, then by label.
- **Concept graph safety:** model output is cleaned in `lib/graph.ts` (unique slug ids, unknown
  dependencies dropped, cycles broken) before it is saved or drawn.
- **Gap map layout:** dagre, top to bottom, foundations first. Nodes cannot be dragged and scroll
  does not zoom (so the page scrolls normally); zoom buttons sit in a row above the map. An
  "All concepts" table under the map gives the same information as text for keyboard and screen
  reader users and small screens.
- **Analyzing a session** updates the topic's score and its spaced-review schedule.
- **Catch the mistake:** the API returns which paragraphs hold planted errors; the client keeps
  that only in React state and IndexedDB (to resume after a refresh) and never renders it until
  the reveal. "Missed" verdicts and false alarms are decided on the server; the model only judges
  the reasons for flagged paragraphs. Score: caught = 1, partly = 0.5, missed = 0, averaged,
  minus 10 per false alarm.
- **Catch the mistake on the Gap map:** when a topic has a map, each planted error is tied to a
  concept. A later round nudges that concept one step (a miss drops solid to shaky, a catch lifts
  missing to shaky) and the detail panel lists the results. Explaining stays the stronger evidence.
- **"New explanation"** replaces the unfinished round instead of keeping it.
- **Shared rescoring:** every finished activity (analysis, catch the mistake, graded challenge)
  calls `rescoreTopic` in `lib/progress.ts`, which recomputes the topic score and moves the next
  review with SM-2. So an Apply it revisit reschedules the topic just like a session.
- **Apply it:** an unanswered scenario is kept (with your draft answer, saved when you leave the
  box) until you submit it or ask for a new one. New scenarios are told to differ from the last five.
- **Understanding chart:** one topic at a time (a topic select), so it is a single series in the
  accent color with no legend. Each point is the score right after a finished activity, recomputed
  with the same formula. The draw-in animation is off to keep motion to short transitions.
- **Revisit angles** rotate persona -> analogy -> apply -> catch the mistake. The angle is
  recorded when you press "Start revisit". "New persona" picks a persona different from the last
  explain session. The analogy angle adds a rule to the learner prompt to ask for an analogy and
  probe where it breaks down.
- **Notes:** PDF text is extracted in the browser with pdfjs-dist (its worker is bundled by Next).
  A topic links to one note; a note can serve several topics. Excerpts: the whole note if it is
  under 6,000 characters, otherwise the ~800-character chunks sharing the most keywords with the
  topic (and focus), kept in their original order. The excerpt is sent with chat, analysis, catch
  the mistake and Apply it requests, and sessions show "Using your notes: <title>".
- **Voice:** the mic (Explain chat and Apply it answers) uses the Web Speech API and is hidden
  when the browser has no speech recognition (for example Firefox). Speech is appended to what
  you already typed. "Read replies aloud" uses speech synthesis; the choice is remembered in this
  browser only.
- **Accessibility:** checked with axe-core on every page at 1440px and 390px (no violations).
  Status always has a text label next to its colored square; the chat transcript is an
  `aria-live` region; all inputs have labels. Small "shaky" text on its tinted callout uses a
  darker shade (`--status-shaky-text`) to reach 4.5:1 contrast.
- **Design audit:** no shadows, gradients, blur, translucency, emoji, animations (chart
  draw-in is off) or radii above 4px; icons only for mic and upload. Concepts on the Gap map are
  always true statements; a student's error appears as a misconception, never as a concept.
- **Dark theme** was not built (the spec lists it as optional).
- **Rate limit:** 20 API requests per minute per IP, in memory.
- **Next.js dev badge** is turned off (`devIndicators: false`) because it floats over the sidebar.

## Known limitations

- Data is per browser. Clearing site data or switching devices loses it (use Settings > Export).
- Gemini's free tier allows only a few requests per minute and models are sometimes overloaded;
  the app shows a "try again" message when both models are unavailable.
- Voice input needs a browser with speech recognition (Chrome, Edge, Safari) and microphone
  permission.
- Scanned PDFs (images only) have no extractable text; paste the text instead.
- The per-IP rate limit is in memory and best-effort; it resets whenever the serverless function
  restarts.
