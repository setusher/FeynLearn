import { db, newId } from "./db";
import { topicScore } from "./score";
import type { Challenge, Concept, ConceptStatus, Note, Session, Topic } from "./types";

// Demo data so every dashboard box has content on first run. Loaded automatically
// once, or on request via Settings > Load demo data. Every topic and note is marked
// `sample: true` and shown with a "Sample data" chip. Removable via Clear all data.

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
  const interestId = newId();

  const first: Session = {
    id: newId(),
    topicId: seasonsId,
    mode: "explain",
    persona: "child",
    startedAt: now - 9 * DAY,
    endedAt: now - 9 * DAY + 14 * 60 * 1000,
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

  const interest: Session = {
    id: newId(),
    topicId: interestId,
    mode: "explain",
    persona: "friend",
    startedAt: now - 5 * DAY,
    endedAt: now - 5 * DAY + 11 * 60 * 1000,
    messages: [
      { role: "user", text: "Compound interest is when the bank pays you interest, and the interest is always worked out on the money you first put in." },
      {
        role: "ai",
        text: "So if I leave 1,000 in for ten years, every year I get exactly the same amount added?",
        misconception: {
          name: "Interest only on the original amount",
          correction: "That describes simple interest; compound interest is also paid on interest already earned, so each year's interest grows.",
        },
      },
      { role: "user", text: "Oh, no. The interest gets added to the balance, so next year you earn interest on the interest too. That's why it grows faster over time." },
      { role: "ai", text: "Faster how? Does it matter how often they add the interest?" },
      { role: "user", text: "I think compounding monthly gives a bit more than yearly, but I'm not sure why." },
    ],
    concepts: [
      { id: "principal", label: "Interest is a percentage of a balance", status: "solid", evidence: "\"the bank pays you interest\"", note: "Clear on the basic idea.", dependsOn: [] },
      { id: "reinvest", label: "Earned interest is added to the balance", status: "solid", evidence: "\"The interest gets added to the balance\"", note: "Stated after the learner's question.", dependsOn: ["principal"] },
      { id: "interest-on-interest", label: "Later interest is earned on past interest", status: "solid", evidence: "\"you earn interest on the interest too\"", note: "Corrected the simple-interest idea.", dependsOn: ["reinvest"] },
      { id: "frequency", label: "More frequent compounding grows slightly faster", status: "shaky", evidence: "\"monthly gives a bit more than yearly, but I'm not sure why\"", note: "Right direction, no reason given.", dependsOn: ["interest-on-interest"] },
      { id: "exponential", label: "Growth accelerates over long periods", status: "shaky", evidence: "\"it grows faster over time\"", note: "Hinted at, not explained.", dependsOn: ["interest-on-interest"] },
      { id: "formula", label: "A = P(1 + r/n)^(nt) models the balance", status: "missing", evidence: "not mentioned", note: "No formula or worked numbers.", dependsOn: ["frequency"] },
      { id: "time", label: "Time matters more than the starting amount", status: "missing", evidence: "not mentioned", note: "The role of starting early was not discussed.", dependsOn: ["exponential"] },
    ],
    summary: "You corrected the simple-interest mix-up and explained interest on interest clearly. Why compounding frequency matters, and how time drives the growth, are still vague.",
    misconceptions: [
      { name: "Interest only on the original amount", correction: "Compound interest is also paid on interest already earned." },
    ],
    coverage: 57,
    accuracy: 85,
  };

  const note: Note = {
    id: newId(),
    title: "Finance 101: compound interest",
    sample: true,
    createdAt: now - 6 * DAY,
    text: [
      "Compound interest",
      "Simple interest is paid only on the principal (the original deposit). Compound interest is paid on the principal plus all interest already added to the account.",
      "Formula: A = P(1 + r/n)^(nt), where P is the principal, r the annual rate as a decimal, n the number of compounding periods per year and t the number of years.",
      "Example: 1,000 at 5% compounded yearly for 10 years gives 1,628.89. With simple interest it would be 1,500.",
      "More frequent compounding (monthly, daily) gives slightly more, because each period's interest starts earning sooner. The effect is small compared with the rate and the time.",
      "Rule of 72: divide 72 by the interest rate in percent to estimate the years needed to double. At 6%, money doubles in about 12 years.",
      "Time is the strongest factor: starting ten years earlier can matter more than saving twice as much each month.",
    ].join("\n\n"),
  };

  // Not linked on purpose: linking it to the seasons topic is part of the demo.
  const seasonsNote: Note = {
    id: newId(),
    title: "Earth science: why seasons happen",
    sample: true,
    createdAt: now - 8 * DAY,
    text: [
      "Seasons",
      "Earth's axis is tilted about 23.4 degrees relative to its orbit, and it keeps pointing the same way (toward Polaris) all year.",
      "When a hemisphere is tilted toward the Sun, sunlight arrives at a steeper angle, so the same energy falls on a smaller area. Days are also longer. Both mean more energy per day: summer.",
      "The other hemisphere is tilted away at the same time, so it has winter. Seasons in the two hemispheres are opposite.",
      "Distance is not the cause. Earth is closest to the Sun (perihelion) in early January, during the northern winter. The orbit is nearly circular; distance changes by only about 3%.",
      "Seasonal lag: the warmest weeks come about 4 to 6 weeks after the summer solstice because land and especially oceans keep absorbing more energy than they lose.",
      "Near the equator the Sun's angle changes little through the year, so temperature seasons are weak; wet and dry seasons matter more there.",
    ].join("\n\n"),
  };

  const seasonsSessions = [first, second, reverse];
  const seasons: Topic = {
    id: seasonsId,
    name: "Why do seasons happen?",
    createdAt: now - 9 * DAY,
    intervalDays: 1,
    ease: 2.36,
    nextReview: now - 2 * HOUR,
    latestScore: topicScore(seasonsSessions, [challenge]) ?? undefined,
    lastAngle: "reverse",
    sample: true,
  };
  const interestTopic: Topic = {
    id: interestId,
    name: "How does compound interest work?",
    createdAt: now - 6 * DAY,
    noteId: note.id,
    intervalDays: 3,
    ease: 2.5,
    nextReview: now + 2 * DAY,
    latestScore: topicScore([interest], []) ?? undefined,
    lastAngle: "persona",
    sample: true,
  };

  // Per-session score snapshots for the Understanding chart.
  first.score = topicScore([first], []) ?? undefined;
  second.score = topicScore([first, second], []) ?? undefined;
  reverse.score = topicScore([first, second, reverse], []) ?? undefined;
  interest.score = interestTopic.latestScore;

  await db.transaction("rw", [db.topics, db.sessions, db.challenges, db.notes, db.settings], async () => {
    await removeSampleData();
    await db.topics.bulkAdd([seasons, interestTopic]);
    await db.sessions.bulkAdd([first, second, reverse, interest]);
    await db.challenges.add(challenge);
    await db.notes.bulkAdd([note, seasonsNote]);
    const settings = await db.settings.get("app");
    await db.settings.put({ key: "app", theme: "dark", name: settings?.name, seeded: true });
  });
}

/** Delete earlier demo topics (with their sessions and challenges) and demo notes. */
async function removeSampleData(): Promise<void> {
  const ids = (await db.topics.filter((t) => t.sample === true).toArray()).map((t) => t.id);
  if (ids.length) {
    await db.sessions.where("topicId").anyOf(ids).delete();
    await db.challenges.where("topicId").anyOf(ids).delete();
    await db.topics.bulkDelete(ids);
  }
  await db.notes.filter((n) => n.sample === true).delete();
}

/**
 * Load demo data once, the first time the app opens with an empty database.
 * Returns true if it seeded.
 */
export async function autoSeed(): Promise<boolean> {
  const settings = await db.settings.get("app");
  if (settings?.seeded) return false;
  if ((await db.topics.count()) > 0) {
    await db.settings.put({ key: "app", theme: "dark", name: settings?.name, seeded: true });
    return false;
  }
  await seedSampleData();
  return true;
}
