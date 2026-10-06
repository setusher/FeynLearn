# FeynLearn demo script (3 minutes)

A reproducible screen recording that shows every part of the track prompt: understand, connect, apply.

## Before you record

- Use a **fresh browser profile or a private window** so the app starts on the welcome screen and loads the
  sample data. Window size 1440x900 (or 1920x1080).
- Deployed link open, `GEMINI_API_KEY` set. Send one throwaway chat message a minute before recording to wake the
  server, then clear it (Settings > Clear all data > Load demo data, or just open a new private window).
- The free Gemini tier is rate limited: rehearse once, then wait a few minutes before the real take.
- AI replies vary. The lines to type below are fixed; read the replies as they come.

The sample topic used throughout is **"Why do seasons happen?"** (it already has two past attempts, a
Catch the mistake round and an Apply it challenge). The sample note **"Earth science: why seasons happen"**
is uploaded but not linked yet.

## 0:00-0:20 The problem

**Screen:** the lime-on-black welcome screen ("Hi.").

**Say:** "Students reread and highlight, and it feels like learning, until they have to explain why something
happens. FeynLearn uses the Feynman technique: you learn it by teaching it."

**Do:** type your name, press **Continue**. The bento dashboard appears with the sample data.

## 0:20-1:20 Explain it, with notes and a misconception flag

**Do (in the Session box):**

1. Topic: type `Why do seasons happen?`
2. **Use notes:** choose `Use notes: Earth science: why seasons happen`.
3. Persona: **Curious 10-year-old**. Mode: **Explain**. Press **Begin session**.
4. Type, then press Enter:
   `Seasons happen because in summer the Earth is closer to the Sun, so it gets hotter.`
   - A **Common misconception** callout appears under the learner's question.
   - **Say:** "It flags the misconception, but stays in character and keeps asking."
5. Type:
   `Actually no. Earth's axis is tilted about 23.4 degrees and always points the same way, so in June the northern half leans toward the Sun.`
6. Type:
   `Leaning toward the Sun means sunlight hits at a steeper angle, so the same energy lands on a smaller area, and the days are longer. More energy per day means summer, while the southern hemisphere has winter.`
7. Type:
   `The hottest weeks come about six weeks after the solstice, because the oceans keep storing heat.`
8. Press **End and analyze** (header of the Session box). Wait for "Analyzing your explanation".

**Say while it analyzes:** "My notes are linked, so the learner and the grader judge me against my own course
material. Only a short excerpt is sent; the notes stay in the browser."

## 1:20-1:50 Gap map, before and after

**Do:** the result appears in the Session box (score, concepts found, misconceptions). Press **Open gap map**.

1. Point at nodes marked **"was shaky"** that are now **Solid** (for example day length or the seasonal lag).
2. Click one node: the detail box shows the exact sentence you typed as evidence.
3. Toggle **Previous** and back to **Latest** at the top of the graph.

**Say:** "Every concept is backed by a quote from what I said. Red and amber are what to study next."

## 1:50-2:25 Catch the mistake

**Do:**

1. Go to **Dashboard**. In the Session box header switch the mode to **Catch the mistake**, difficulty
   **Moderate**. Topic `Why do seasons happen?`. Press **Begin session**.
2. Read the paragraphs. Click the one that is wrong (usually it blames the distance to the Sun, reverses day
   length, or puts the hottest day on the solstice).
3. In "What's wrong with this?" type the correct fact, for example
   `Distance does not cause seasons; Earth is closest to the Sun in January.` Press **Submit flag**.
4. Press **Finish and reveal**: verdict chips (Caught, Partly, Missed), the correct facts, any false alarms.

**Say:** "Spotting errors in someone else's explanation is a different skill from explaining. The answers stay
hidden until I reveal."

## 2:25-2:50 Apply it, and the score moves

**Do:**

1. On the dashboard press **New scenario** in the Apply it box. A realistic scenario appears.
2. Type:
   `The hemisphere tilted toward the Sun gets steeper sunlight and longer days, so more energy per square metre, which is why it is warmer there. This assumes clear skies; ocean currents, altitude and the lag after the solstice can change local temperatures.`
3. Press **Submit answer**: the rubric fills in (concept, reasoning, limits) and the model answer appears.
4. Click **Understanding** in the top bar: the score chart has new points.

**Say:** "Application is graded on reasoning and limits, not recall. Everything feeds one understanding score."

## 2:50-3:00 Close

**Screen:** Revisit (the topic is scheduled with the next angle, for example "explain it through an analogy").

**Say:** "FeynLearn: explain it, see your gaps, catch the mistakes, apply it, and come back from a new angle.
Learn it by teaching it."

## If something goes wrong on camera

- "The AI model is overloaded" or "free-tier limit": wait 30-60 seconds and press **Try again**. Cut the pause.
- If the analysis does not show "was shaky" changes, the comparison is still there: toggle Previous/Latest.
- To reset completely: Settings > Clear all data, then Load demo data.
