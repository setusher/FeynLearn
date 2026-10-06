# Design and engineering decisions

A log of the choices made while building FeynLearn, kept out of the README so it stays short.
The product spec is [`BUILD_SPEC.md`](../BUILD_SPEC.md); the UI rebuild spec is [`UI_SPEC.md`](../UI_SPEC.md).

## Build history (first design)

- [x] Phase 1: shell, theme, sidebar layout, route stubs, dashboard with sample data and empty state
- [x] Phase 2: Explain mode
- [x] Phase 3: Analyze and Gap map
- [x] Phase 4: Catch the mistake
- [x] Phase 5: Apply it, Understanding, Revisit, Notes
- [x] Phase 6: Voice and polish
- [x] Phase 7: Design audit

## UI rebuild (UI_SPEC.md) status

The first editorial design is tagged `v1-editorial`. [`UI_SPEC.md`](../UI_SPEC.md) replaces its visual rules
with a dark, lime-accent bento layout.

- [x] Phase 1: tokens, Manrope, top bar with pill tabs, /welcome, bento dashboard with seeded data
- [x] Phase 2: Session box (Explain inside the dashboard)
- [x] Phase 3: Analyze and Gap map
- [x] Phase 4: Catch the mistake
- [x] Phase 5: Understanding, Apply it, Revisit, Notes pages
- [x] Phase 6: Voice, responsive, accessibility, settings, tests
- [x] Phase 7: Submission pack
- [x] Phase 8: Design audit

UI rebuild decisions:

- `--text-3` (#66666B) is only 3.2:1 on cards, below AA for text, so it is used for disabled controls,
  placeholders and decorative marks only. Readable hints, including the notes privacy line, use `--text-2`.
- Old token names (`surface`, `ink`, `accent`, ...) are mapped onto the new palette in `globals.css`, so pages not yet
  rebuilt render correctly on the dark theme until their phase.
- Settings live in a Dexie `settings` table (v2 schema). `seeded` means "demo data was auto-loaded once"; Clear all
  data keeps the name and leaves `seeded` true so the demo does not reappear, and Settings > Load demo data
  brings it back on request (replacing any earlier sample). Sample topics and notes carry `sample: true` and show
  a "Sample data" chip.
- First launch (no name) redirects to /welcome. /welcome never redirects away, so the logo can always return there.
- Dashboard boxes are not links themselves (they hold inputs and buttons); each has an arrow link at the top right,
  and the border lights up on hover or focus inside.
- The dashboard grid has a fixed height (viewport minus top bar) at 1100px and up, so the `1fr` rows divide the
  screen instead of growing with content; it fits 1440x900 without scrolling. Below 1100px it is a 6-column grid,
  below 700px a single column.
- The understanding donut splits the overall score into each part's weighted contribution, so the segments add up to
  the number in the middle; the legend shows each part's own average.
- The reference screenshot (dt.png) was not available, so the layout follows the written description.
- Welcome page: black background with lime type, three zones (top row, greeting and steps, wordmark). The
  wordmark is sized with canvas text metrics so its visible letters, not its text box, span the content width
  exactly; it re-fits on resize and after fonts load. It fits 1440x900 and 1920x1080 without scrolling;
  smaller screens scroll with the wordmark last. `--text-2` on the black background is 7.0:1.
- Commits carry no AI co-author trailer, at the repository owner's request.

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

## UI rebuild, phases 2-8

- **One Session box, two places.** The dashboard box and /session render the same `SessionPanel`. The active
  session (mode, topic, persona or difficulty, session id) is stored in Dexie settings, so a refresh, or moving
  between the dashboard and /session, returns to the same conversation. Links from Revisit and the Gap map
  ("Practice this concept") pass the session in the URL; /session turns it into the active session and
  cleans the URL.
- **Session logic in hooks.** `lib/useExplain.ts` and `lib/useReverse.ts` hold the API calls and persistence;
  the box components only render. The transcript is read live from IndexedDB.
- **Catch the mistake inline.** Selecting a paragraph opens the "What's wrong with this?" field directly under
  it. Starting a session in this mode generates the explanation immediately. Planted-error data stays out of
  the DOM until the reveal (checked in a browser test against the page HTML).
- **/session side boxes.** "Topic concepts so far" marks a concept as mentioned when your messages contain at
  least half of its keywords (`lib/mentions.ts`). It is a live hint; the real judgement is the analysis.
- **Feature pages** (Gap map, Apply it, Understanding, Revisit, Notes, Settings) are bento grids sized to the
  viewport on desktop, with scrolling inside boxes. Below 1100px they stack.
- **Scrollable box bodies are focusable** (`tabIndex=0`, labelled by the box title) so keyboard users can
  scroll them.
- **Demo data** has two notes: the compound-interest note is linked; the seasons note is not, so linking a note
  can be shown live.
- **Screenshots** in `docs/screenshots/` come from `scripts/capture-screenshots.mjs` against the running app.
