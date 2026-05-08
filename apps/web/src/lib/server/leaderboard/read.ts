import * as kvKeys from "../kv/keys";
import { isoWeekKey } from "../timezone/helpers";

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
  return {
    weekKey: week,
    weekly: weeklyRaw ? JSON.parse(weeklyRaw) : { rows: [] },
    allTime: allTimeRaw ? JSON.parse(allTimeRaw) : { rows: [] },
  };
}
