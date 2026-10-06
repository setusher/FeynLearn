# FeynLearn: submission text

Ready to paste into the submission form. Replace the two link placeholders before submitting.

## Title

FeynLearn: learn it by teaching it

## Short description

An AI learner that asks "why?" until you can really explain a topic, then maps which ideas you have solid, shaky
or missing, makes you catch planted mistakes, and grades how you apply the idea to real situations.

## Track

AI + Education

## Links

- Live demo: _add the Vercel link_
- Demo video: _add the video link_
- Code: https://github.com/setusher/FeynLearn

## Problem statement

Most studying is recognition: rereading, highlighting, flashcards. It feels productive, but it does not show
whether you can explain why something happens or use it in a new situation, and students usually find their gaps
in the exam. Learners without a tutor have no one to question them, and generic AI chatbots make it worse by
explaining things for them.

Who it is for: students who can recite definitions but cannot explain them, self-learners with no teacher, and
anyone preparing for an exam who needs to know exactly where their understanding breaks.

## What it does

- **Explain it:** you teach a topic to an AI learner (a curious 10-year-old, a skeptical friend or a strict
  professor) that asks one probing question at a time, challenges vague words, and flags misconceptions with a
  one-sentence correction.
- **Gap map:** after the session, your explanation becomes a concept map of 5-8 key ideas, each marked solid, shaky
  or missing with a quote from what you said. Compare attempts to see what improved.
- **Catch the mistake:** the AI writes an explanation with 1-3 planted errors based on common misconceptions; you
  flag and justify, then see what you caught, missed or flagged wrongly.
- **Apply it:** a concrete scenario with names and numbers, graded on using the concept, sound reasoning, and
  seeing limits, with a model answer afterwards.
- **Revisit:** spaced review (1, 3, 7, 14, 30 days) that comes back from a different angle each time.
- **Your notes:** upload a PDF or text; it becomes the reference the AI judges you against.

## Technical approach

- Next.js with four API routes, each a narrow AI task with a Zod schema: a conversational persona, a structured
  analysis into a concept graph, adversarial generation of flawed explanations plus judging, and rubric grading.
- Every model response is validated and retried once if malformed; if Gemini's main model is overloaded the call
  falls back to a lighter model. Errors are shown inline with a retry.
- Prompts are written to keep the AI honest: the persona never lectures, the analysis must quote the student
  verbatim or say "not mentioned", concept labels must be true statements, and planted errors must not hint at
  themselves.
- What should not depend on the model is plain, unit-tested code: coverage from concept statuses, missed verdicts
  and false alarms, the score formula, the spaced-review scheduler and graph cleanup.
- Grounding: PDF text is extracted in the browser; the most relevant excerpt of a linked note (up to about 6,000
  characters, chosen by keyword overlap) goes with each request.
- Privacy by design: no accounts and no server database. Everything lives in the browser (IndexedDB); the API key
  stays on the server.

Built with Next.js, TypeScript, Tailwind CSS, Vercel AI SDK with Google Gemini, Zod, Dexie, Zustand, React Flow,
Recharts, pdfjs-dist, Web Speech API and Vitest.

## Real-world impact

FeynLearn turns passive review into active recall and explanation, the study habits with the strongest evidence
behind them. The gap map tells a learner what to study next instead of rereading everything, Catch the mistake
trains critical reading, and Apply it practises transfer to new situations. It runs in any browser, works with a
student's own notes, needs no account, and costs nothing to run on free tiers, so it can reach students without
tutors.

## Limitations

The AI can misjudge an answer, so scores are guidance rather than grades. The free Gemini tier is rate limited.
Data stays in one browser (with JSON export). Voice input depends on browser support.
