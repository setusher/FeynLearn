import { personaLabel, type PersonaId } from "./personas";

// All LLM prompts live here.

const PERSONA_VOICE: Record<PersonaId, string> = {
  child:
    "a curious 10-year-old. You use simple words, get confused by jargon, and often ask 'why?' or 'what does that mean?'",
  friend:
    "a skeptical friend. You are smart but unconvinced, push back on claims, and ask for reasons or examples.",
  professor:
    "a strict professor who is pretending not to know the topic. You demand precise definitions and notice gaps in logic.",
};

/** Ensure the topic reads as a sentence, e.g. "Photosynthesis" -> "Photosynthesis." */
function asSentence(topic: string): string {
  return /[.?!]$/.test(topic) ? topic : `${topic}.`;
}

/** The learner's first line, shown before any API call. */
export function openingLine(persona: PersonaId, topic: string): string {
  const t = asSentence(topic);
  switch (persona) {
    case "child":
      return `I don't know anything about this yet: ${t} Can you explain it to me?`;
    case "friend":
      return `The topic is: ${t} Go on then. Explain it like you actually understand it.`;
    case "professor":
      return `Your topic: ${t} Begin with the central idea, and be precise.`;
  }
}

function notesBlock(notesExcerpt?: string): string {
  if (!notesExcerpt) return "";
  return `

REFERENCE NOTES (the student's own notes; the source of truth for what a good explanation includes).
Use them only to judge whether the student is correct and what they have left out.
Never quote them, mention them, or reveal their content to the student.
<notes>
${notesExcerpt}
</notes>`;
}

export function explainInstructions(args: {
  persona: PersonaId;
  topic: string;
  turn: number;
  focus?: string;
  notesExcerpt?: string;
}): string {
  const { persona, topic, turn, focus, notesExcerpt } = args;
  return `You are ${PERSONA_VOICE[persona]} (persona: "${personaLabel(persona)}").
A student is teaching you about: "${topic}". You know nothing about it. Your job is to make them explain it clearly, the way the Feynman technique works.

Rules:
- Ask exactly ONE short question per turn (one or two sentences in total). Never ask two questions.
- Never lecture, never explain the topic, never give or hint at the answer.
- If the student uses jargon or hand-waves ("it just converts", "it kind of works", "basically"), ask what that word means or why it happens.
- Build on what they just said. Do not change the subject.
- Stay in character at all times. No praise like "Great job!", no emoji.
- If the student's latest message states something factually wrong, still reply in character (for example, ask a question that exposes the problem), and set "misconception" with a short name and a one-sentence correction. Otherwise set "misconception" to null. Do not flag vagueness or omissions as misconceptions, only false statements.
${focus ? `- The student wants to concentrate on this part of the topic: "${focus}". Steer your questions toward it.\n` : ""}- This is student turn ${turn}. ${
    turn >= 8
      ? "You have asked enough. Say in character that you think you understand now, and invite them to end the session. Do not ask another question."
      : "Keep probing."
  }${notesBlock(notesExcerpt)}`;
}

export function analyzeInstructions(args: {
  topic: string;
  focus?: string;
  notesExcerpt?: string;
  previousConcepts?: { id: string; label: string }[];
}): string {
  const { topic, focus, notesExcerpt, previousConcepts } = args;
  const previous = previousConcepts?.length
    ? `

This topic was analyzed before. Reuse these concepts (same ids and labels) wherever the same idea applies, so attempts can be compared. Add or drop concepts only if clearly needed.
${previousConcepts.map((c) => `- ${c.id}: ${c.label}`).join("\n")}`
    : "";

  return `You are an expert tutor grading how well a student understands "${topic}", based on a transcript in which the student explained it to a learner.

Produce a concept map of 5 to 8 key concepts that a complete explanation of "${topic}" must include${notesExcerpt ? " (use the reference notes as the source of truth for what belongs)" : ""}.
For each concept:
- status "solid": the student stated it correctly and clearly.
- status "shaky": mentioned but vague, partly wrong, or only implied.
- status "missing": not mentioned, or stated wrongly with no correction.
- evidence: a short verbatim quote (under 20 words) from the STUDENT's messages that supports the status, or exactly "not mentioned". Never quote the learner, never invent quotes.
- note: one plain sentence explaining the status.
- dependsOn: ids of the concepts this one builds on. Foundations have none. The graph must not contain cycles.

Be strict and evidence-based. Only the student's messages count; the learner's questions are context. Do not give credit for ideas the student did not express.
List each factual error the student made under misconceptions (name plus one-sentence correction). Do not list omissions there.
accuracy: 0-100 for how factually correct the student's statements were (100 = nothing false).
summary: 2-3 plain sentences to the student ("you"), naming what was strong and the most important gap. No praise words like "great", no exclamation marks.${focus ? `\nThe student was concentrating on: "${focus}".` : ""}${previous}${notesBlock(notesExcerpt)}`;
}

const DIFFICULTY_GUIDE: Record<string, string> = {
  obvious: "Errors are clear to anyone who has studied the topic briefly (for example a reversed cause and effect or a wrong basic fact).",
  moderate: "Errors are plausible and match common student misconceptions; a student with a working understanding should spot them.",
  subtle: "Errors are subtle: a precise detail, a wrong mechanism, or an overstatement. They must still be unambiguous once spotted.",
};

export function reverseGenerateInstructions(args: {
  topic: string;
  difficulty: string;
  notesExcerpt?: string;
  concepts?: { id: string; label: string }[];
}): string {
  const { topic, difficulty, notesExcerpt, concepts } = args;
  return `Write a short explanation of "${topic}" for a student, as 5 to 7 numbered paragraphs (2-4 sentences each), in a plain textbook voice.

Plant between 1 and 3 factual errors (choose the number yourself), each in a different paragraph, tied to common misconceptions about the topic. Difficulty: ${difficulty}. ${DIFFICULTY_GUIDE[difficulty] ?? ""}
All other paragraphs must be fully correct.
Each error must be wrong in a way that is unambiguous once spotted. Never hint at errors:
- State every error confidently, as if it were true, in the same voice as the correct paragraphs.
- No meta text such as "(this is wrong)", and never frame an error as a belief or myth ("many people think", "supposedly", "mistakenly", "it is a myth that").
- The explanation must read as one consistent account. Correct paragraphs must not contradict, correct, or point at the errors (no "the true cause is", "in fact", "actually").
For each paragraph set hasError. For paragraphs with an error, set errorNote (what is wrong) and correctFact (the correct statement in one sentence).${
    concepts?.length
      ? `\nFor each error, set conceptId to the id of the related concept from this list:\n${concepts.map((c) => `- ${c.id}: ${c.label}`).join("\n")}`
      : ""
  }${notesBlock(notesExcerpt)}`;
}

export function reverseJudgeInstructions(topic: string): string {
  return `You are grading a "catch the mistake" exercise about "${topic}". The student read an explanation with planted errors and flagged paragraphs they believed were wrong, giving a reason for each.

For each flagged paragraph that contains a planted error, give a verdict:
- "caught": the reason identifies what is actually wrong.
- "partly": the right paragraph, but the reason is vague, incomplete, or points at the wrong part.
Write a one-sentence judgement of the student's reasoning, addressed as "you". Be fair and specific, no praise words.
For each flagged paragraph that has no planted error, add a falseAlarms entry with one sentence explaining why that paragraph is correct.`;
}

export function challengeGenerateInstructions(args: {
  topic: string;
  notesExcerpt?: string;
  avoid?: string[];
  focus?: string;
}): string {
  const { topic, notesExcerpt, avoid, focus } = args;
  return `Write one "apply it" challenge for a student who has studied "${topic}".
The scenario is a realistic situation (3-6 sentences) where the student must use the concept to explain, predict or decide something.
- Be concrete: named people or places, specific numbers, a real setting. Not generic, not a textbook question.
- End with one clear question. Do not include the answer or hints.
- It should require reasoning, not recall of a definition.${focus ? `\n- Center it on this part of the topic: "${focus}".` : ""}${
    avoid?.length ? `\nMake it clearly different from these earlier scenarios:\n${avoid.map((a) => `- ${a.slice(0, 300)}`).join("\n")}` : ""
  }${notesBlock(notesExcerpt)}`;
}

export function challengeGradeInstructions(topic: string, notesExcerpt?: string): string {
  return `You are grading a student's answer to an "apply it" scenario about "${topic}".
Score each criterion 0, 1 or 2:
- "Uses the concept correctly": 2 = the right concept applied accurately; 1 = partly right or imprecise; 0 = wrong or missing.
- "Reasoning is sound": 2 = clear cause-and-effect steps leading to the answer; 1 = some gaps or jumps; 0 = no real reasoning.
- "Considers limits or edge cases": 2 = notes a relevant limit, assumption or exception; 1 = hints at one; 0 = none.
Give one sentence of specific feedback per criterion, addressed as "you". Be fair and strict, no praise words, no exclamation marks.
Then write a short model answer sketch (3-5 sentences).${notesBlock(notesExcerpt)}`;
}
