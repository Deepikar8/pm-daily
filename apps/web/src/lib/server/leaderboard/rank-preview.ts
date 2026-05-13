import { LEADERBOARD_LIMIT } from "$lib/leaderboard/config";
import type { LeaderboardRow } from "./read";

export function previewWeeklyRank(rows: LeaderboardRow[], points: number): number | null {
  const rankIndex = rows.findIndex((row) => points > (row.weeklyPoints ?? 0));
  if (rankIndex >= 0) return rankIndex + 1;
  if (rows.length < LEADERBOARD_LIMIT) return rows.length + 1;
  return null;
}

