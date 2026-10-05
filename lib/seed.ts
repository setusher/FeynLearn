import { db, newId } from "./db";
import { topicScore } from "./score";
import type { Challenge, Concept, ConceptStatus, Session, Topic } from "./types";

// Sample data so the dashboard, Gap map and charts look populated on first run.
// Removable via Settings > Clear all data.

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

const SEASON_CONCEPTS: Omit<Concept, "status" | "evidence" | "note">[] = [
  { id: "tilt", label: "Earth's axis is tilted about 23.4 degrees", dependsOn: [] },
  { id: "fixed-tilt", label: "The tilt points the same way all year", dependsOn: ["tilt"] },
  { id: "angle", label: "Sunlight angle sets energy per area", dependsOn: ["fixed-tilt"] },
  { id: "day-length", label: "Day length changes with the seasons", dependsOn: ["fixed-tilt"] },
  { id: "hemispheres", label: "Hemispheres have opposite seasons", dependsOn: ["fixed-tilt"] },
  { id: "distance", label: "Distance to the Sun is not the cause", dependsOn: ["hemispheres"] },
  { id: "temperature", label: "More energy per day means warmer weather", dependsOn: ["angle", "day-length"] },
];

function concepts(
  rows: Record<string, [ConceptStatus, string, string]>,
): Concept[] {
  return SEASON_CONCEPTS.map((c) => {
    const [status, evidence, note] = rows[c.id];
    return { ...c, status, evidence, note };
  });
}

export async function seedSampleData(now: number = Date.now()): Promise<void> {
  const seasonsId = newId();
  const vaccinesId = newId();

  const first: Session = {
    id: newId(),
    topicId: seasonsId,
    mode: "explain",
    persona: "child",
    startedAt: now - 6 * DAY,
    endedAt: now - 6 * DAY + 14 * 60 * 1000,
    messages: [
      { role: "user", text: "Seasons happen because the Earth goes around the Sun, and in summer we are closer to it so it gets hotter." },
      {
        role: "ai",
        text: "Closer to the Sun? So is everyone on Earth having summer at the same time?",
        misconception: {
          name: "Distance causes seasons",
          correction: "Earth is actually closest to the Sun in early January, during the northern winter; the tilt of the axis is what causes seasons.",
        },
      },
      { role: "user", text: "I think so? Maybe it's a bit different in other countries but it kind of works the same everywhere." },
      { role: "ai", text: "What do you mean by \"kind of works the same\"? What would be different in another country?" },
      { role: "user", text: "Some places are hotter because they are near the equator. Also the Earth is tilted a bit." },
      { role: "ai", text: "Tilted? What does being tilted have to do with summer and winter?" },
      { role: "user", text: "Not sure honestly, I think the tilt makes some parts closer to the Sun." },
    ],
    concepts: concepts({
      tilt: ["shaky", "\"Also the Earth is tilted a bit.\"", "Mentions the tilt but not its size or role."],
      "fixed-tilt": ["missing", "not mentioned", "No sign the student knows the axis keeps pointing the same direction."],
      angle: ["missing", "not mentioned", "Does not connect the tilt to how directly sunlight hits the ground."],
      "day-length": ["missing", "not mentioned", "Longer summer days are never brought up."],
      hemispheres: ["missing", "\"it kind of works the same everywhere\"", "Believes seasons happen at the same time everywhere."],
      distance: ["missing", "\"in summer we are closer to it so it gets hotter\"", "Holds the distance misconception directly."],
      temperature: ["shaky", "\"so it gets hotter\"", "Knows summer is hotter but the reason given is wrong."],
    }),
    summary: "You know the Earth is tilted, but you explained seasons mainly through distance from the Sun, which is the most common misconception here. The angle of sunlight and day length were not mentioned.",
    misconceptions: [
      { name: "Distance causes seasons", correction: "Earth is closest to the Sun in January; tilt, not distance, causes seasons." },
      { name: "Tilt brings one hemisphere closer", correction: "The tilt changes the angle of sunlight, not the distance in any meaningful way." },
    ],
    coverage: 22,
    accuracy: 30,
  };

  const second: Session = {
    id: newId(),
    topicId: seasonsId,
    mode: "explain",
    persona: "friend",
    startedAt: now - 2 * DAY - 3 * HOUR,
    endedAt: now - 2 * DAY - 3 * HOUR + 18 * 60 * 1000,
    messages: [
      { role: "user", text: "The Earth's axis is tilted about 23 degrees and it stays pointing the same way while we orbit the Sun." },
      { role: "ai", text: "Fine, it's tilted. Why would that make July hot and January cold for me?" },
      { role: "user", text: "In June the northern half leans toward the Sun, so sunlight hits it more directly. The same energy lands on a smaller area, so it heats up more." },
      { role: "ai", text: "And the people in Australia during our June?" },
      { role: "user", text: "They lean away from the Sun, so it's their winter. Seasons are opposite in the two hemispheres." },
      { role: "ai", text: "So it's nothing to do with being closer to the Sun?" },
      { role: "user", text: "Right, we're actually closest in January. Also days are longer in summer, which I think adds some heat." },
    ],
    concepts: concepts({
      tilt: ["solid", "\"tilted about 23 degrees\"", "States the tilt and roughly its size."],
      "fixed-tilt": ["solid", "\"it stays pointing the same way while we orbit\"", "Clear on the fixed direction of the axis."],
      angle: ["solid", "\"The same energy lands on a smaller area\"", "Explains energy per area correctly."],
      "day-length": ["shaky", "\"days are longer in summer, which I think adds some heat\"", "Mentions day length but is unsure how it matters."],
      hemispheres: ["solid", "\"Seasons are opposite in the two hemispheres.\"", "Correct and unprompted."],
      distance: ["solid", "\"we're actually closest in January\"", "Corrected the earlier misconception."],
      temperature: ["shaky", "\"so it heats up more\"", "Links energy to warming but skips why it accumulates over weeks."],
    }),
    summary: "A clear improvement. You explained tilt, sunlight angle and opposite hemispheres well, and dropped the distance idea. Day length and the lag between energy and temperature are still vague.",
    misconceptions: [],
    coverage: 78,
    accuracy: 90,
  };

  const reverse: Session = {
    id: newId(),
    topicId: seasonsId,
    mode: "reverse",
    startedAt: now - 1 * DAY - 5 * HOUR,
    endedAt: now - 1 * DAY - 5 * HOUR + 9 * 60 * 1000,
    messages: [],
    reverse: {
      difficulty: "moderate",
      paragraphs: [
        { text: "Earth orbits the Sun once a year while spinning on an axis that is tilted about 23.4 degrees.", hasError: false },
        { text: "Because the orbit is a near-perfect circle, the distance to the Sun changes by only about 3 percent.", hasError: false },
        { text: "The axis always points toward the North Star, so during part of the year the Northern Hemisphere leans toward the Sun.", hasError: false },
        { text: "When a hemisphere leans toward the Sun, sunlight arrives at a steeper angle and its days are shorter.", hasError: true, conceptId: "day-length", errorNote: "Days get longer, not shorter, in the hemisphere tilted toward the Sun.", correctFact: "The hemisphere tilted toward the Sun has longer days and steeper sunlight." },
        { text: "The summer solstice is the hottest day of the year because it has the most daylight.", hasError: true, conceptId: "temperature", errorNote: "Peak heat lags the solstice by several weeks.", correctFact: "The hottest weeks usually come 4-6 weeks after the solstice, because land and oceans keep storing heat." },
        { text: "At the equator, the angle of sunlight changes little, so seasons there are mild.", hasError: false },
      ],
      flags: [
        { index: 3, reason: "Days are longer in summer, not shorter." },
        { index: 1, reason: "I don't think the distance changes at all." },
      ],
      verdicts: [
        { index: 3, verdict: "caught", correctFact: "The hemisphere tilted toward the Sun has longer days and steeper sunlight.", judgement: "Correct and precise." },
        { index: 4, verdict: "missed", correctFact: "The hottest weeks usually come 4-6 weeks after the solstice, because land and oceans keep storing heat.", judgement: "Not flagged. This is the seasonal lag." },
      ],
      falseAlarms: [{ index: 1, note: "The distance does change by about 3 percent; the paragraph was correct." }],
      score: 40,
    },
  };

  const challenge: Challenge = {
    id: newId(),
    topicId: seasonsId,
    createdAt: now - 1 * DAY,
    scenario:
      "Priya lives in Melbourne, Australia, and is planning a beach trip with her cousin from Toronto. Her cousin suggests going in July 'because that's summer'. Priya disagrees. Melbourne sits at about 38 degrees south. Explain who is right for a beach trip in Melbourne and why, using what causes seasons.",
    answer:
      "Priya is right. In July the Southern Hemisphere is tilted away from the Sun, so sunlight hits Melbourne at a low angle and the days are short. That means less energy per square metre, so it is winter. They should go in January instead.",
    rubric: [
      { criterion: "Uses the concept correctly", score: 2, feedback: "Correctly uses tilt and opposite hemispheres." },
      { criterion: "Reasoning is sound", score: 2, feedback: "Connects angle and day length to energy received." },
      { criterion: "Considers limits or edge cases", score: 1, feedback: "Could note that local weather and ocean temperature lag also matter." },
    ],
    modelAnswer:
      "Priya is right. In July the Southern Hemisphere tilts away from the Sun, so Melbourne gets low-angle sunlight and short days, meaning less energy per area: it is winter. Late January to February is warmest, since ocean temperatures lag the solstice.",
  };

  const vaccines: Session = {
    id: newId(),
    topicId: vaccinesId,
    mode: "explain",
    persona: "professor",
    startedAt: now - 4 * DAY,
    endedAt: now - 4 * DAY + 12 * 60 * 1000,
    messages: [
      { role: "user", text: "A vaccine shows your immune system a harmless version of a germ so it learns to recognise it." },
      { role: "ai", text: "Define \"learns\". What physically changes in the body?" },
      { role: "user", text: "It makes antibodies and memory cells that stay around, so next time the response is faster." },
    ],
    concepts: [
      { id: "antigen", label: "Vaccines present an antigen", status: "solid", evidence: "\"a harmless version of a germ\"", note: "Correct idea, informal wording.", dependsOn: [] },
      { id: "b-cells", label: "B cells produce antibodies", status: "shaky", evidence: "\"It makes antibodies\"", note: "Does not say which cells make them.", dependsOn: ["antigen"] },
      { id: "memory", label: "Memory cells persist", status: "solid", evidence: "\"memory cells that stay around\"", note: "Clear.", dependsOn: ["b-cells"] },
      { id: "secondary", label: "Secondary response is faster and stronger", status: "solid", evidence: "\"next time the response is faster\"", note: "Correct.", dependsOn: ["memory"] },
      { id: "t-cells", label: "T cells also play a role", status: "missing", evidence: "not mentioned", note: "No mention of T cells.", dependsOn: ["antigen"] },
    ],
    summary: "Good core picture of antibodies and memory. T cells were not mentioned and the role of B cells was implied, not stated.",
    misconceptions: [],
    coverage: 64,
    accuracy: 85,
  };

  const seasonsSessions = [first, second, reverse];
  const seasons: Topic = {
    id: seasonsId,
    name: "Why do seasons happen?",
    createdAt: now - 6 * DAY,
    intervalDays: 1,
    ease: 2.36,
    nextReview: now - 2 * HOUR,
    latestScore: topicScore(seasonsSessions, [challenge]) ?? undefined,
    lastAngle: "reverse",
  };
  const vaccinesTopic: Topic = {
    id: vaccinesId,
    name: "How vaccines train the immune system",
    createdAt: now - 4 * DAY,
    intervalDays: 3,
    ease: 2.5,
    nextReview: now + 1 * DAY,
    latestScore: topicScore([vaccines], []) ?? undefined,
    lastAngle: "persona",
  };

  // Per-session score snapshots for the Understanding chart.
  first.score = topicScore([first], []) ?? undefined;
  second.score = topicScore([first, second], []) ?? undefined;
  reverse.score = topicScore([first, second, reverse], []) ?? undefined;
  vaccines.score = vaccinesTopic.latestScore;

  await db.transaction("rw", [db.topics, db.sessions, db.challenges], async () => {
    await db.topics.bulkAdd([seasons, vaccinesTopic]);
    await db.sessions.bulkAdd([first, second, reverse, vaccines]);
    await db.challenges.add(challenge);
  });
}
