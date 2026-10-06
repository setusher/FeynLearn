# FeynLearn UI rebuild spec

Rebuild the UI layer completely to match this spec. If a BUILD_SPEC.md exists, treat it as the functional spec; this prompt overrides all of its visual and layout rules.

## 0. Context

FeynLearn is my entry for ForgeHacks (student online hackathon, theme "AI for Real World Problems"), AI + Education track. Track prompt: "Build an AI-powered solution that helps learners move beyond memorization to understand concepts, make connections, and apply what they learn."

Judges score a working project that shows real AI use and real-world value. A submission needs: a working app (deployed link), a GitHub repo with a clear README, a 2-4 minute demo video, an architecture diagram or screenshots, and a written description (problem and users, technical approach, real-world impact). Build with that in mind: the app must demo well in a screen recording, and the repo must be submission-ready.

The first version looked plain: too much white space, a sidebar with one-word links, no personality. Fix all of that.

## 1. Visual direction (reference: dark, lime-accent bento dashboard)

I have attached a reference screenshot (dt.png) of a dark dashboard with a lime accent and a bento-box grid. Match its structure and color feel, not its glow. Look at the image first.

What to copy from the reference

- Near-black app background, slightly lighter charcoal cards, one acid-lime accent.
- A bento grid: many rounded boxes of different sizes tightly packed so the screen feels full, with equal small gaps.
- Each box has a small title, a number or chart, and a small action. No box is empty or mostly empty.
- A top bar with logo at left, pill-shaped nav tabs in the middle, small utility icons and a user chip at right.
- Large, bold numerals for key stats; small gray labels.
- A donut chart for a skill breakdown, filled bar charts, small status chips.

What to NOT copy / hard bans

- No gradients anywhere (backgrounds, buttons, charts, text, borders).
- No glow, no blur, no glassmorphism, no neon halos, no soft colored shadows, no purple haze panels like the reference's "AI insight" box.
- No drop shadows on cards or buttons at all. Elevation = background shade + 1px border.
- No floating buttons, floating toolbars, or corner toasts. Everything sits in the grid. Status messages appear inline inside the relevant box.
- No emoji, no sparkle or robot icons, no "AI magic" copy.
- No decorative illustrations or stock photos. No animated backgrounds.
- Motion: 120-150ms color/opacity transitions only.

Design tokens (put in globals.css as CSS variables and in the Tailwind theme):

```
--bg:        #0B0B0C   /* app background */
--card:      #151516   /* box background */
--card-2:    #1D1D1F   /* nested elements, inputs, hover */
--line:      #2A2A2D   /* 1px borders and dividers */
--text:      #F4F4F2
--text-2:    #9A9A9F   /* secondary text */
--text-3:    #66666B   /* hints, disabled */
--lime:      #C6F432   /* accent: primary buttons, active tab, key numbers */
--on-lime:   #0B0B0C   /* text on lime */
--solid:     #C6F432   /* concept status: solid */
--shaky:     #F2B53A   /* concept status: shaky */
--missing:   #FF6A5C   /* concept status: missing / errors */
```

- Card radius 20px; nested elements and inputs 12px; buttons 12px; small chips and nav tabs 999px (pill). Nothing else is pill-shaped.
- Font: Manrope (via next/font), weights 400/500/600/700. Tabular figures for all numbers. Big numerals 40-64px/700. Box titles 14px/600, secondary text 13px.
- Charts: flat fills only. Lime for the primary series, --card-2/gray for the rest. Thin gridlines in --line.
- Status is never color-only: always pair with a text label ("Solid", "Shaky", "Missing").

## 2. App structure

### 2.1 Welcome ("Hi") screen, route /welcome, shown on first launch

- Full-viewport solid lime (--lime) background. Giant wordmark "FeynLearn" (clamp 72px to 200px, weight 700, --on-lime color), left-aligned, anchored toward the lower-left, like a poster. Small tagline above or below: "Learn it by teaching it."
- At the top left: "Hi." in large type, followed by a one-line prompt "What should I call you?" with a name input and an "Enter" button (dark button on lime).
- Under it, three small plain statements in a row (no cards): "Explain it. Catch the mistake. Apply it." Each with a one-line description.
- Name saved in IndexedDB settings. After Enter, go to the dashboard. The logo in the top bar links back to /welcome ("Hi" screen) at any time. On later visits, skip straight to the dashboard, which greets "Hi, {name}".
- Flat design only. No gradients, no shapes floating around.

### 2.2 Global shell (every page except /welcome)

- Top bar (72px high, --bg, bottom 1px --line): left = small lime square logo mark with "F" plus the FeynLearn wordmark at 28px/700 (clearly bigger than a typical nav title); center = pill tabs: Dashboard, Session, Gap map, Apply it, Understanding, Revisit, Notes. Active tab = lime fill with --on-lime text; inactive = --card fill with --text-2. Right = streak chip ("4 day streak"), settings icon button, user chip (initials circle + name).
- No sidebar. Navigation to features is via the top pills and by clicking the bento boxes on the dashboard (each box opens its full page).
- Page content sits in a grid with 24px outer padding and 16px gaps. Max width 1600px, centered.
- Every full feature page also uses boxes (card layout), never loose content on a blank background.

### 2.3 Dashboard (/) bento grid

Target: desktop 1440x900 shows the entire dashboard with no empty areas and no scroll needed for the core view. Use CSS grid, 12 columns, 3 rows after the top bar (rows roughly 1fr 1fr 0.8fr, with min-height safeguards so content never clips; allow vertical scroll on smaller screens).

```
+-----------------------------------------+--------------------------+
| A. SESSION BOX (cols 1-7, rows 1-2)     | B. UNDERSTANDING SCORE   |
|  [ Explain | Catch the mistake ] toggle |   (cols 8-12, row 1)     |
|  topic input, persona, live chat        |   donut + big number     |
|  or reverse-mode paragraphs             +------------+-------------+
|  input docked at bottom of the box      | C. REVISIT | D. STATS    |
|                                         | (8-10,row2)| (11-12,row2)|
+--------------+--------------+-----------+------------+-------------+
| E. GAP MAP   | F. APPLY IT  | G. NOTES (cols 9-12, row 3)          |
| (cols 1-4)   | (cols 5-8)   |                                      |
+--------------+--------------+--------------------------------------+
```

A. Session box (hero) - the main feature, lives directly on the dashboard

- Header row: title "Session", the mode toggle (segmented control, two joined options: Explain | Catch the mistake; active = lime), and persona select (Explain mode) or difficulty select (Catch mode).
- State 1 (no active session): topic input, "Use notes" select (pulls from Notes), big lime "Begin session" button, and under it 3 suggested topics as chips plus "Resume last session" if one exists. Also shows a short "How this works" line. This state must still look filled (use the chips, last-session summary, and a mini list of recent topics).
- State 2 (Explain active): chat transcript fills the box and scrolls internally. AI messages in --card-2 rounded boxes at the left, user messages in lime-outlined boxes at the right (flat, no tails). Misconception callout = a bordered box with --shaky left bar, label "Common misconception", one-sentence correction. Input row docked at the bottom of the box (textarea, mic button, send button). "End and analyze" button in the header.
- State 3 (Catch active): numbered paragraphs as selectable rows; selecting one expands an inline "What's wrong with this?" field below it. Footer button "Finish and reveal". Reveal view lists each planted error with verdict chip (Caught / Partly / Missed), the correct fact, and false alarms. Keep hasError flags out of the DOM until reveal.
- After analysis, show a result summary inside the same box (score, concepts found, misconceptions) with "Open gap map".

B. Understanding score box: label + range select ("Last 7 days"), flat donut (solid segments: Coverage, Accuracy, Application, Spot-the-error; lime and grays, with legend and percentages), giant overall number in the center, small delta chip ("+6 this week"). Click opens /understanding.

C. Revisit box: list of up to 3 due/upcoming topics, each row = topic name, "Due today / in 3 days" chip, and a small outline "Start" button. Shows the angle for the next revisit ("Next: explain it to a skeptical friend"). Click header opens /revisit.

D. Stats: two stacked mini tiles: Sessions this week (big number + 7 tiny bars) and Topics studied (big number + small caption). Same flat style.

E. Gap map box: a live miniature of the latest topic's concept graph (React Flow, non-interactive, tiny rectangular nodes with status squares) plus a legend line "5 solid, 2 shaky, 1 missing" and "Open gap map" link. Never an empty placeholder: use seeded data on first run.

F. Apply it box: shows the latest or generated scenario excerpt (3 lines, truncated), a rubric mini-bar (3 small segments for the 3 criteria), and two buttons: "New scenario" (lime) and "Open".

G. Notes box (upload, done properly): a bordered dashed dropzone (12px radius, --line dashed border, "Drop a PDF or TXT here, or browse" with an upload icon, and a "Paste text" secondary button) on top; below it, the list of uploaded notes as compact rows (file icon, title, size, linked topic chip, small "x" remove). Upload progress and errors inline in the box. Privacy line in --text-3: "Notes stay in your browser. Only the excerpt used in a session is sent to the AI." Drag-over state: lime border and --card-2 background.

Make every box a button-like region with a clear hover state (border turns --text-3), keyboard focusable, and an arrow icon at the top right that signals "open".

### 2.4 Feature pages

Each page keeps the top bar and uses a bento layout, not loose content.

- /session: same Session box but full size (2/3 width) with a right column of boxes: session timer, "Topic concepts so far" live list, misconception log, tips box.
- /gap-map: large graph box (React Flow, dagre layout, flat rectangular nodes with status squares and text labels, no animated edges) + right-hand detail box for the selected node (evidence quote, AI note, "Practice this concept" button) + a "Previous attempt vs latest" toggle at the top of the graph box + a small summary box listing counts per status.
- /apply: left box scenario + answer textarea; right column boxes: rubric results (3 criteria, 0-2 scores as segmented bars with feedback), model answer (revealed after submit), history list.
- /understanding: top row of 4 stat boxes; large line chart box (flat lines, topic filter chips); topic table box; "How is this calculated?" box showing the formula (40% concept coverage, 25% accuracy with misconception penalties, 20% apply-it rubric, 15% catch-the-mistake; redistribute weight when a component has no data).
- /revisit: Due box, Upcoming box (calendar-like list), Scheduling explanation box. SM-2 intervals 1/3/7/14/30 days, poor score resets. Each revisit uses a different angle (new persona, analogy, apply-it scenario, or catch-the-mistake).
- /notes: large dropzone box, notes list box, preview box for selected note's extracted text, linking control to assign a note to a topic.
- Settings (modal or page): name, export data JSON, clear all data, load demo data.

### 2.5 Screen-filling rules

- Never leave a box mostly empty. If there is no data, show seeded demo content with a small "Sample data" chip, or a compact instructive empty state with a primary action.
- Boxes align on a shared grid; equal 16px gaps; all boxes in a row have equal height.
- Internal scrolling inside boxes (chat, lists) rather than the whole page scrolling, on desktop.
- Responsive: at <1100px, 6-column grid; at <700px single column, top tabs become a horizontally scrollable pill row. Test at 1440, 1024, 390 widths.

## 3. Functional spec (keep or build)

Stack (fixed): Next.js 14+ App Router, TypeScript strict, Tailwind with the tokens above (restyle any shadcn primitives completely to match, or skip shadcn), Zustand, Dexie (IndexedDB), Vercel AI SDK with @ai-sdk/google (Gemini free tier; provider/model isolated in lib/llm.ts), Zod for every structured LLM response (validate, retry once, then show a clear inline error), React Flow (@xyflow/react), Recharts, pdfjs-dist (client-side PDF text), Web Speech API (feature-detect; hide mic if unsupported). Must deploy on Vercel free tier with only GEMINI_API_KEY set. No auth, no server database.

API routes (app/api/*/route.ts, POST, Zod-validated bodies, capped input lengths, no key leakage, best-effort in-memory rate limit):

- /api/chat -> { reply, misconception: null | { name, correction } }. Persona prompt: curious learner who knows nothing about the topic; ONE short question per turn; never lectures; probes vague words; flags wrong statements through misconception; after ~8 turns invites the student to end the session. Notes excerpt (first ~6000 chars or best keyword-overlap chunks) is the source of truth for correctness and is never quoted to the student.
- /api/reverse -> generate (paragraphs with 1-3 planted subtle errors tied to common misconceptions, difficulty Obvious/Moderate/Subtle) and judge (verdict per error plus false alarms).
- /api/analyze -> 5-8 concepts with status, evidence (quote or "not mentioned"), note, dependsOn (DAG), plus misconceptions, summary, and sub-scores.
- /api/challenge -> generate (concrete scenario) and grade (3 criteria, 0-2 each, feedback, model answer).

Data (Dexie): Topic, Concept, Session, Challenge, Note, Settings (name, theme, seeded flag). Everything persists across refresh. Seed demo data (2 topics such as "Why do seasons happen?" and "How does compound interest work?", with sessions, concepts, scores, one challenge, one note) via "Load demo data" and automatically on first run, always labeled as sample data.

## 4. Hackathon submission deliverables (build these too)

- README.md (repo root), polished and structured:
  - Title, one-line pitch, track (AI + Education), live demo link placeholder, demo video link placeholder.
  - Problem statement and target users (students who memorize but cannot explain; self-learners; exam prep).
  - Solution overview with screenshots section (/docs/screenshots/ placeholders and a short script to capture them, or instructions).
  - Features mapped to the prompt: Understand (Feynman chat, misconceptions), Connect (gap map, revisit angles), Apply (challenge).
  - Technical approach and components: where AI is used (conversational persona, structured analysis, adversarial explanation generation, rubric grading), prompt design notes, validation with Zod, grounding in user notes.
  - Architecture diagram as a Mermaid block (browser, Zustand/Dexie, Next.js API routes, Gemini, pdfjs, Web Speech) and also exported as docs/architecture.md.
  - How it creates real-world impact and honest limitations (LLM errors, free-tier rate limits, browser-only storage, speech support).
  - Setup: npm i, .env.local with GEMINI_API_KEY, npm run dev, Vercel deploy steps.
  - Tech stack list and team/credits placeholder.
- docs/SUBMISSION.md: ready-to-paste Devpost text: title, short description, track, problem statement, technical approach, impact. Concise and honest.
- docs/DEMO_SCRIPT.md: a 3-minute video script with timestamps: problem (0:00-0:20), Explain mode with a misconception flag (0:20-1:20), Gap map before/after (1:20-1:50), Catch the mistake (1:50-2:25), Apply it and score (2:25-2:50), close (2:50-3:00). List the exact seeded topic and inputs to type so the demo is reproducible.
- A /welcome-based first impression suitable for the first 5 seconds of the video.
- .env.example, license (MIT), and no secrets committed.

## 5. Quality bar

- TypeScript strict, ESLint clean, npm run build passes.
- Loading, empty, error states in every box (inline text, never a floating toast). Loading = a plain "Working..." line with a thin static lime bar, no shimmer.
- Vitest tests for sm2.ts and the score formula.
- Accessibility: AA contrast (lime on near-black and dark-on-lime are fine; verify gray text on cards), visible 2px lime focus ring, keyboard-operable toggle (arrow keys), labels on all inputs, aria-live="polite" on the transcript, status never color-only.
- Keep components small; business logic in lib/.

## 6. Build phases (stop and report after each, with what to test)

1. Foundation: tokens, Manrope, Tailwind theme, top bar with big wordmark and pill tabs, /welcome Hi screen, empty bento shell with the grid and all boxes as styled placeholders filled with seeded data.
2. Session box: toggle, Explain mode end to end (/api/chat, misconception callouts, persistence).
3. Analyze + Gap map: /api/analyze, mini graph in the dashboard box and the full page.
4. Catch the mistake: /api/reverse, selection UI, reveal.
5. Remaining boxes and pages: Understanding (donut, chart, formula), Apply it, Revisit (SM-2), Notes (dropzone, PDF/TXT, linking).
6. Voice, responsive, accessibility, settings, tests.
7. Submission pack: README, architecture diagram, SUBMISSION.md, DEMO_SCRIPT.md, screenshots instructions.
8. Design audit: go through the hard-ban list in section 1 and remove every violation (gradients, glows, shadows, floating elements, emoji). Take screenshots at 1440, 1024, and 390 widths. Confirm the dashboard has no large empty areas. Fix issues.

Definition of done: a judge can open the deployed link, see the Hi screen, land on a full bento dashboard, run an Explain session, get a misconception callout, end the session, see the gap map update, flip to Catch the mistake, complete an Apply it challenge, upload notes that change the AI's questions, and see their Understanding score change. The repo is submission-ready.

Start with Phase 1. Before coding, view the reference image, then give me a short plan (file tree, dependencies, and your grid template for the dashboard).
