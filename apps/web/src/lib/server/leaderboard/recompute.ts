import { desc, eq, isNull } from "drizzle-orm";
import { getDb, type DB } from "../db/client";
import { users, userStats } from "../db/schema";
import * as kvKeys from "../kv/keys";
import { isoWeekKey } from "../timezone/helpers";

let _lastRunAt = 0;

type KVPut = { put(key: string, value: string): Promise<void> };
// `DB` may be a Cloudflare D1Database (prod) or a pre-built drizzle instance
// (tests with better-sqlite3). If it's a raw D1Database we wrap it; otherwise
// we use it directly.
type Env = { DB: D1Database | DB; KV: KVPut };

function asDrizzle(d: D1Database | DB): DB {
  // A drizzle instance has `.select` while a raw D1Database has `.prepare`.
  if (typeof (d as DB).select === "function") return d as DB;
  return getDb(d as D1Database);
}

export async function recomputeLeaderboard(env: Env, opts?: { force?: boolean }): Promise<void> {
  const now = Date.now();
  if (!opts?.force && now - _lastRunAt < 30_000) return;   // 30s debounce
  _lastRunAt = now;

  const db = asDrizzle(env.DB);
  const week = isoWeekKey("UTC");

  const weekly = await db
    .select({
      userId: users.id,
      displayName: users.displayName,
      weeklyPoints: userStats.weeklyPoints,
      currentStreak: userStats.currentStreak,
      totalAttempts: userStats.totalAttempts,
      weekKey: userStats.weekKey,
    })
    .from(users)
    .innerJoin(userStats, eq(userStats.userId, users.id))
    .where(isNull(users.deletedAt))
    .orderBy(desc(userStats.weeklyPoints))
    .limit(50)
    .all();

  const allTime = await db
    .select({
      userId: users.id,
      displayName: users.displayName,
      totalPoints: userStats.totalPoints,
      currentStreak: userStats.currentStreak,
    })
    .from(users)
    .innerJoin(userStats, eq(userStats.userId, users.id))
    .where(isNull(users.deletedAt))
    .orderBy(desc(userStats.totalPoints))
    .limit(50)
    .all();

  await env.KV.put(
    kvKeys.leaderboardWeekly(week),
    JSON.stringify({ rows: weekly, weekKey: week, computedAt: now }),
  );
  await env.KV.put(
    kvKeys.leaderboardAllTime(),
    JSON.stringify({ rows: allTime, computedAt: now }),
  );
}

// For tests
export function _resetDebounce() { _lastRunAt = 0; }
