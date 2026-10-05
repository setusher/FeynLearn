# Claude Code Prompt: Build FeynLearn

Paste everything below into Claude Code from an empty project folder. Tip: also save it as `BUILD_SPEC.md` in the repo so Claude Code can re-read it.

---

You are building **FeynLearn**, a web app for a hackathon (AI + Education track). Read this whole spec first, then plan, then build in the phases listed at the end. After each phase, run the app, fix errors, and tell me what to test before moving on. Ask me nothing unless something is truly blocking; make sensible decisions and note them in the README.

## 1. What the product is

FeynLearn helps students move beyond memorization by making them **teach** a concept. Hackathon prompt: "help learners move beyond memorization to understand concepts, make connections, and apply what they learn."

- **Understand:** Feynman chat, misconception flags
- **Connect:** Gap Map, spaced revisit from new angles
- **Apply:** Apply It Challenge

No login. All user data lives in the browser (IndexedDB). The only server code is API routes that call the LLM so the key stays secret.

## 2. Tech stack (fixed, do not substitute)

- Next.js 14+ (App Router), TypeScript, strict mode
- Tailwind CSS, with a custom theme from section 4 (do NOT use default shadcn look; if you use shadcn primitives, restyle them fully to match section 4)
- Zustand (UI/session state), Dexie (IndexedDB persistence)
- Vercel AI SDK (`ai` + `@ai-sdk/google`) using Gemini free tier. Put the model name and provider in a single `lib/llm.ts` so it can be swapped to Groq later. Env var: `GEMINI_API_KEY`
- Zod for every structured LLM response (validate, retry once on failure, then show a human error message)
- React Flow (`@xyflow/react`) for the Gap Map
- Recharts for the score chart
- `pdfjs-dist` for client-side PDF text extraction
- Web Speech API for voice (feature-detect; hide mic if unsupported)
- Must deploy on Vercel's free plan with zero extra config. No database server, no auth, no paid services.

## 3. Information architecture and layout

Single app shell, desktop-first, fully usable on mobile.

```
+----------------+----------------------------------------------+
| FeynLearn      |  Topic: [ Photosynthesis      ]  Streak: 4   |
|----------------|----------------------------------------------|
| Dashboard      |                                              |
| Gap map        |   (main content area, changes by route)      |
| Apply it       |                                              |
| Understanding  |                                              |
| Revisit   (3)  |                                              |
| Notes          |                                              |
+----------------+----------------------------------------------+
```

- Left sidebar is a normal fixed-width column (240px) that is part of the page grid, separated by a 1px border. It is NOT floating, NOT rounded, NOT translucent. On mobile it becomes a top bar with a menu that opens a plain full-height drawer.
- Sidebar items, in order: **Dashboard, Gap map, Apply it, Understanding, Revisit, Notes**. Revisit shows a small plain count badge when topics are due.
- Routes: `/` (dashboard), `/session`, `/gap-map`, `/apply`, `/understanding`, `/revisit`, `/notes`.

### 3.1 Dashboard (`/`, the opening screen)

Top to bottom, in a single column max-width 960px, left aligned like a document:

1. Heading "Good evening" style greeting by time of day plus one plain sentence, e.g. "You have 2 topics due for revisit."
2. A row of three plain stat blocks separated by vertical rules (not shadowed cards): Overall understanding (0-100), Sessions this week, Topics studied.
3. **Start a session** block: topic text input, persona select (only needed for Explain mode), the **mode toggle**, and a primary button "Begin session". Optional link "Use my notes for this topic" if notes exist.
4. Table-style list "Recent topics": columns Topic, Last session, Score, Next review. Rows are clickable. Plain table with hairline row dividers.
5. "Due for revisit" list with a button on each row.

Empty state (first run): a short paragraph explaining the idea in two sentences and a "Try a sample topic" link that preloads a seeded topic ("Why do seasons happen?") with fake past data so the dashboard and charts look populated for judges. Make the seed data removable via Settings > "Clear all data".

### 3.2 Session (`/session`): the main feature

Top of the page: a **segmented toggle** with two options, `Explain` and `Catch the mistake`. It is an inline control placed in the page header row, left aligned, never floating. Switching modes keeps the topic and starts a fresh session (confirm if a session is in progress).

**Mode A: Explain (Feynman chat)**

- Persona select: "Curious 10-year-old", "Skeptical friend", "Strict professor".
- Chat transcript is a vertical column, max-width 720px. Messages are not bubbles with tails; use a simple left-aligned layout with a small label ("You", "Learner") above each message, and a hairline divider between turns. This reads like a written dialogue.
- The AI asks exactly ONE short question at a time, never explains the topic itself, and probes vague words ("it just converts", "it kind of works").
- When the AI detects a misconception in the student's last message, the AI message is followed by a **callout block**: left 3px border in the warning color, label "Common misconception", one-sentence correction. Misconception data comes back as structured JSON alongside the chat reply (see section 6).
- Input area: docked at the bottom of the main column as part of normal layout (a bordered row with textarea, a Mic button, a Send button). Not floating, no shadow.
- Header actions: "End session and analyze" (primary) and "Discard".
- On end: call `/api/analyze`, show a progress line ("Analyzing your explanation..."), then route to the Gap Map for this topic with a summary panel above it.

**Mode B: Catch the mistake (Teach mode in reverse)**

- AI writes a short explanation (5-7 numbered paragraphs) of the topic with **1 to 3 planted errors**. The `hasError` flags are returned by the API but must be kept out of the DOM until reveal (store in state, do not render in attributes).
- Student clicks a paragraph to select it, then a side panel appears (inline, in-flow, not a modal) with a textarea "What's wrong with this?" and "Submit flag". Student can flag several paragraphs.
- Difficulty select: Obvious / Moderate / Subtle.
- "Finish and reveal": each planted error is shown with a verdict (Caught / Partly / Missed), the correct fact, and the AI's judgement of the student's reasoning. Also show "false alarms" (flagged paragraphs that were correct).
- Results feed the Understanding score and Gap Map (caught = good evidence, missed = shaky/missing).

### 3.3 Gap map (`/gap-map`)

- Topic selector at the top. React Flow graph, 5-8 concept nodes, edges showing dependency ("because", "requires"). Auto layout (dagre or a simple layered layout), no physics wobble, no animated edges.
- Node style: white rectangle, 1px border, small status marker as a solid colored square at the left plus a text status ("Solid", "Shaky", "Missing"). Do not rely on color alone.
- Click a node: right-hand in-flow detail panel with the evidence quote from the student's session, the AI's note, and a button "Practice this concept" which starts a session pre-focused on it.
- Show a "Previous attempt vs this attempt" toggle if the topic has 2+ sessions (this is the key demo moment: red nodes turning green).

### 3.4 Apply it (`/apply`)

- Pick a topic, press "Generate scenario". AI returns a realistic scenario (3-6 sentences, concrete numbers/names, not generic).
- Student writes an answer in a large textarea. "Submit answer" returns a rubric: 3 criteria (Uses the concept correctly, Reasoning is sound, Considers limits or edge cases), each scored 0-2 with one sentence of feedback, plus a short model-answer sketch shown after submission.
- Keep history of past challenges per topic in a plain list.

### 3.5 Understanding (`/understanding`)

- Overall score at the top (large numeral, plain).
- Line chart (Recharts) of score over time per topic, with a topic filter. Flat styling: thin line, small dots, light gridlines, no gradient fill, no animation beyond default.
- Table below: topic, sessions, misconceptions found, best score, latest score.
- Score formula (document it in code comments and a small "How is this calculated?" disclosure): 40% concept coverage from the latest analysis, 25% accuracy (misconceptions penalized), 20% apply-it rubric average, 15% catch-the-mistake performance. If a component has no data, redistribute weight.

### 3.6 Revisit (`/revisit`)

- Simple SM-2-style scheduler in `lib/sm2.ts` with intervals starting 1, 3, 7, 14, 30 days; a poor score resets the interval.
- List of due topics, then upcoming topics with dates.
- Starting a revisit picks a **different angle** than last time: rotate among (new persona), (explain via an analogy), (apply it scenario), (catch the mistake). Show the chosen angle in plain text before starting, e.g. "This time: explain it to a skeptical friend."

### 3.7 Notes (`/notes`)

- Upload PDF/TXT or paste text. Extract text client-side. Show a list of notes with title, size, linked topic.
- Linking notes to a topic means `/api/analyze`, `/api/chat`, and `/api/reverse` receive a trimmed excerpt (cap about 6,000 characters, chosen simply by taking the first N characters, or most relevant chunks via keyword overlap) as reference material. The AI should treat notes as the source of truth for what a good explanation includes.
- Show a clear note: "Your notes stay in your browser; only the excerpt used in a session is sent to the AI."

## 4. Design system (very important, read carefully)

The UI must look like a **well-made editorial or reference tool**, like a good library catalog, a Stripe docs page, or Linear's plain surfaces. It must NOT look like a generic AI-generated landing page.

**Hard bans:**

- No gradients anywhere (backgrounds, buttons, text, borders).
- No glow, no neon, no text shadows, no drop shadows on cards or buttons (a 1px border is the elevation system). The only permitted shadow is a subtle one on dropdown menus.
- No glassmorphism, no backdrop blur, no translucent panels.
- No floating action buttons, no floating toolbars, no sticky pills, no toasts that hover over content in the corner (use inline status text, or a single plain banner row at the top of the main area).
- No emoji in the UI. No sparkle icons, no robot icons, no "AI magic" language.
- No purple/indigo-to-pink color schemes. No big hero sections with centered text and a glowing CTA.
- No pill-shaped everything. No oversized rounded corners.
- No animated gradient borders, no shimmering skeletons (use a plain "Loading..." line or a thin static progress bar).
- No decorative illustrations or stock imagery.
- Do not center-align long content. Left align and use a text column.

**Palette (CSS variables, light theme first; add a dark theme only if time remains):**

- `--bg: #F7F5F0` (warm paper)
- `--surface: #FFFFFF`
- `--ink: #1B1B18` (primary text)
- `--ink-2: #5C5A52` (secondary text)
- `--line: #DDD9CE` (all borders and dividers)
- `--accent: #1F3A5F` (deep ink blue; primary buttons, links, focus ring)
- `--status-solid: #2F6B45`, `--status-shaky: #A66A00`, `--status-missing: #A63A2B` (muted, used only for understanding status and warnings)
- Backgrounds for callouts use very light tints of the status colors (e.g. `#F6EBD3` for warning).

**Typography:**

- Headings and large numerals: a serif such as **Newsreader** or **Source Serif 4** (via `next/font`).
- UI and body: **IBM Plex Sans** or **Public Sans** (not Inter, not Poppins).
- Base size 15-16px, line-height 1.55, headings tight but not huge (h1 28-32px max). Use font weight 500-600, no extra-bold.
- Numbers in tables and scores use tabular figures.

**Components:**

- Border radius 4px for inputs, buttons, cards, nodes; 6px max anywhere.
- Primary button: solid `--accent`, white text, 1px same-color border, 36px height, no shadow; hover darkens slightly. Secondary: transparent with 1px `--line` border. Link-style tertiary actions are underlined text.
- Inputs: white surface, 1px `--line`, focus shows 2px `--accent` outline offset 1px.
- Segmented toggle: two joined buttons sharing a 1px border; active one is filled with `--accent`, inactive is white. Keyboard accessible (arrow keys, `role="tablist"` or radio group).
- Tables with hairline row dividers, no zebra stripes, no card-per-row.
- Spacing on an 4px base scale; generous whitespace but dense enough to feel like a tool.
- Icons: use sparingly (lucide-react, stroke 1.5, 16px) only for mic, upload, chevron. Most nav items are text only.
- Microcopy: plain, specific, human. Example: "No sessions yet. Pick a topic above and explain it in your own words." Avoid exclamation marks and hype words.
- Motion: only 120-150ms color/opacity transitions. No bouncing, no parallax, no scale-on-hover.

**Accessibility:** WCAG AA contrast, visible focus states, status never conveyed by color only, labels on all inputs, `aria-live="polite"` on the chat transcript.

## 5. Data model (Dexie, `lib/db.ts`)

```ts
type Topic = { id: string; name: string; createdAt: number; noteId?: string;
  nextReview?: number; intervalDays: number; ease: number; latestScore?: number };
type Concept = { id: string; label: string; status: "solid"|"shaky"|"missing";
  evidence: string; note: string; dependsOn: string[] };
type Session = { id: string; topicId: string; mode: "explain"|"reverse";
  persona?: string; startedAt: number; endedAt?: number;
  messages: { role: "user"|"ai"; text: string; misconception?: {name: string; correction: string} }[];
  concepts?: Concept[]; score?: number; reverse?: ReverseResult };
type Challenge = { id: string; topicId: string; scenario: string; answer?: string;
  rubric?: { criterion: string; score: 0|1|2; feedback: string }[]; modelAnswer?: string; createdAt: number };
type Note = { id: string; title: string; text: string; createdAt: number };
```

## 6. API routes (all POST, JSON, in `app/api/*/route.ts`, runtime nodejs)

1. `/api/chat`: input `{ topic, persona, notesExcerpt?, history, userMessage }`. Output (validated by Zod): `{ reply: string, misconception: null | { name, correction } }`. Use `generateObject` (non-streaming is acceptable for reliability; streaming is a nice-to-have for the reply text only).
2. `/api/reverse`: two actions. `generate`: `{ topic, difficulty, notesExcerpt? }` returns `{ paragraphs: { text, hasError, errorNote?, correctFact? }[] }` with 1-3 errors, plausible and tied to common misconceptions. `judge`: `{ paragraphs, flags: {index, reason}[] }` returns per-error verdicts and false alarms.
3. `/api/analyze`: `{ topic, transcript, notesExcerpt? }` returns `{ concepts: Concept[5-8], misconceptions[], summary, scores: {coverage, accuracy} }`. Concepts must include `dependsOn` edges forming a DAG.
4. `/api/challenge`: actions `generate` and `grade` as in section 3.4.

Rules for all routes: validate request bodies with Zod, cap input lengths, return `{ error: string }` with proper status codes, never log or return the API key, and add a simple in-memory per-IP rate limit (best-effort) to protect the free-tier key.

**Prompt requirements (put prompts in `lib/prompts.ts`):**

- Explain mode system prompt: you are a {persona}. You know nothing about {topic}. Ask ONE short question per turn. Never lecture or give the answer. If the student uses jargon or hand-waves, ask what it means or why. If their statement is wrong, still respond in character, but set `misconception`. If notes are provided, use them only to judge correctness, never to quote at the student. After \~8 turns, say you think you understand and invite them to end the session.
- Reverse mode: errors should be subtle but unambiguous once spotted; never include meta text like "(this is wrong)".
- Analyze: be strict and evidence-based; every concept status must cite a short quote from the student or state "not mentioned".

## 7. Quality and engineering requirements

- TypeScript strict, ESLint clean, no `any` without comment.
- Loading, empty, and error states for every screen. Errors appear inline in the page, with a retry button.
- Persist everything to IndexedDB so a refresh never loses data. Add Settings (a simple page or dialog reachable from the sidebar footer) with "Export data (JSON)" and "Clear all data".
- Keep components small; put LLM and scheduling logic in `lib/`.
- Include unit tests for `sm2.ts` and the score formula (Vitest, a few cases).
- Write a `README.md` with: what it is, setup (`npm i`, `.env.local`), env vars, deploy-to-Vercel steps, and a short "Known limitations" list.
- Provide `.env.example` with `GEMINI_API_KEY=`.
- Do not commit secrets.

## 8. Build phases (stop and report after each)

1. **Shell:** project setup, fonts, Tailwind theme tokens from section 4, sidebar layout, route stubs, dashboard with seeded data and empty state.
2. **Explain mode:** `/api/chat`, session page, transcript, misconception callouts, persistence.
3. **Analyze and Gap map:** `/api/analyze`, React Flow map, node detail panel, attempt comparison.
4. **Catch the mistake:** `/api/reverse`, selection/flagging UI, reveal screen, mode toggle.
5. **Sidebar features:** Apply it, Understanding (chart and score formula), Revisit (SM-2), Notes (PDF/TXT extraction, linking).
6. **Voice and polish:** Web Speech input and optional read-aloud, mobile layout, accessibility pass, settings, tests, README.
7. **Design audit:** go through the hard-ban list in section 4 and remove anything that violates it. Take screenshots at 1440px and 390px widths and fix layout bugs.

## 9. Definition of done

- `npm run build` passes and the app runs on Vercel with only `GEMINI_API_KEY` set.
- A user can: open the dashboard, start Explain mode, get a misconception callout, end the session, see a Gap Map, run Catch the mistake, complete an Apply it challenge, see the Understanding chart update, see the topic in Revisit, and upload notes that influence the AI.
- The UI contains none of the banned patterns in section 4.

Start with Phase 1 now. Before writing code, give me a short plan (file tree and the list of dependencies you will install).
