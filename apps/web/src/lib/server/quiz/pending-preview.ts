import type { Cookies } from "@sveltejs/kit";
import { getDb } from "$lib/server/db/client";
import { readLeaderboards } from "$lib/server/leaderboard/read";
import { previewWeeklyRank } from "$lib/server/leaderboard/rank-preview";
import { anonymousUserId, getPendingQuizClaim } from "./anonymous";
import { scoreQuizState } from "./attempt";
import { getQuizSessionStub } from "./runtime-session";

export async function readPendingQuizPreview(args: {
  env: App.Platform["env"];
  cookies: Cookies;
}): Promise<{
  date: string;
  totalCorrect: number;
  totalPoints: number;
  rank: number | null;
  claimUrl: string;
} | null> {
  const pending = getPendingQuizClaim(args.cookies);
  if (!pending) return null;

  const stub = getQuizSessionStub(args.env, {
    userId: anonymousUserId(pending.anonId),
    date: pending.date,
    sessionId: "default",
  });
  const stateRes = await stub.fetch("https://do/state");
  const state = (await stateRes.json()) as
    | { uninitialized: true }
    | {
        startedAt: number;
        answers: Array<{ position: number; selectedKey: string; answeredAt: number }>;
      };
  if ("uninitialized" in state || state.answers.length === 0) return null;

  const db = getDb(args.env.DB);
  const scored = await scoreQuizState({
    db,
    state: { ...state, userId: anonymousUserId(pending.anonId), date: pending.date },
    date: pending.date,
    streak: 0,
    mode: "scored_today",
  });
  const lb = await readLeaderboards(args.env);

  return {
    date: pending.date,
    totalCorrect: scored.totalCorrect,
    totalPoints: scored.totalPoints,
    rank: previewWeeklyRank(lb.weekly.rows, scored.totalPoints),
    claimUrl: `/quiz/claim?date=${encodeURIComponent(pending.date)}`,
  };
}

