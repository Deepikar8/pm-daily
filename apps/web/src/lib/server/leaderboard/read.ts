import * as kvKeys from "../kv/keys";
import { isoWeekKey } from "../timezone/helpers";
import { LEADERBOARD_LIMIT } from "$lib/leaderboard/config";

type KVGet = { get(key: string): Promise<string | null> };
type Env = { KV: KVGet };

export type LeaderboardRow = {
  userId: string;
  displayName: string;
  weeklyPoints?: number;
  totalPoints?: number;
  currentStreak: number;
  totalAttempts?: number;
};

export async function readLeaderboards(env: Env): Promise<{
  weekKey: string;
  weekly: { rows: LeaderboardRow[]; computedAt?: number };
  allTime: { rows: LeaderboardRow[]; computedAt?: number };
}> {
  const week = isoWeekKey("UTC");
  const [weeklyRaw, allTimeRaw] = await Promise.all([
    env.KV.get(kvKeys.leaderboardWeekly(week)),
    env.KV.get(kvKeys.leaderboardAllTime()),
  ]);
  const weekly = weeklyRaw ? JSON.parse(weeklyRaw) : { rows: [] };
  const allTime = allTimeRaw ? JSON.parse(allTimeRaw) : { rows: [] };

  return {
    weekKey: week,
    weekly: { ...weekly, rows: weekly.rows.slice(0, LEADERBOARD_LIMIT) },
    allTime: { ...allTime, rows: allTime.rows.slice(0, LEADERBOARD_LIMIT) },
  };
}
