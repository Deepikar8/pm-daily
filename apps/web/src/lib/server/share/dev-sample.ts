import type { PublicShareResult } from "./public-result";

export function devShareResult(origin: string): PublicShareResult {
  const path = "/share/dev-sample";
  return {
    date: "2026-05-19",
    url: path,
    absoluteUrl: `${origin}${path}`,
    imageUrl: `${origin}${path}/card.png`,
    player: {
      displayName: "Deepika",
      role: "Founder",
    },
    result: {
      totalCorrect: 4,
      totalSeconds: 95,
      totalPoints: 920,
      rank: 3,
    },
    session: {
      headline: "Introducing the GAIN Framework for feedback",
      sourceTitle: "Introducing the GAIN Framework for feedback",
      sourceByline: "Jack Cohen",
      sourceType: "newsletter",
    },
    questions: [
      {
        position: 1,
        archetype: "diagnose",
        pmTakeaway: "Anchor hard feedback in the shared goal before naming the behavior.",
        correct: true,
      },
      {
        position: 2,
        archetype: "apply",
        pmTakeaway: "Audit failed feedback against Goal, Actions, Impacts, and Next actions.",
        correct: true,
      },
      {
        position: 3,
        archetype: "pick",
        pmTakeaway: "Name what the recipient stands to gain so feedback feels useful, not punitive.",
        correct: false,
      },
      {
        position: 4,
        archetype: "translate",
        pmTakeaway: "Use the opening the recipient gives you; the GAIN order can flex.",
        correct: true,
      },
      {
        position: 5,
        archetype: "spot",
        pmTakeaway: "Close feedback with a who-what-when next action, agreed out loud.",
        correct: true,
      },
    ],
  };
}
