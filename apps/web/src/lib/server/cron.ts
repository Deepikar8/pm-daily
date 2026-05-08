import { desc } from "drizzle-orm";
import { recomputeLeaderboard, _resetDebounce } from "./leaderboard/recompute";
import { getDb, type DB } from "./db/client";
import * as schema from "./db/schema";
import { isoWeekKey } from "./timezone/helpers";

type KVPut = { put(key: string, value: string): Promise<void> };
type Env = {
  DB: D1Database | DB;
  KV: KVPut;
  [k: string]: unknown;
};

function asDrizzle(d: D1Database | DB): DB {
  if (typeof (d as DB).select === "function") return d as DB;
  return getDb(d as D1Database);
}

/**
 * Cron handler invoked by Cloudflare every minute (per wrangler.toml).
 *
 * Two concerns:
 *   1) Safety-net leaderboard recompute every minute. recomputeLeaderboard
 *      is internally debounced 30s, so this is a no-op most of the time
 *      (writes only happen if a quiz was submitted in the last 30s).
 *   2) Weekly archive rollover at Monday 00:00 UTC: copy every userStats
 *      row's weeklyPoints into weekly_archive (rank by weeklyPoints desc),
 *      then reset weeklyPoints to 0 and bump weekKey to the new ISO week.
 */
export async function runCron(
  event: { scheduledTime: number },
  env: Env,
): Promise<void> {
  // 1) Safety-net leaderboard recompute. recomputeLeaderboard is debounced
  // internally (30s), so the per-minute cron only writes KV if a quiz was
  // submitted recently and an in-process recompute hasn't already fired.
  await recomputeLeaderboard(env);

  // 2) Weekly rollover gate: Monday (UTC dow=1), 00:00 UTC.
  const t = new Date(event.scheduledTime);
  if (t.getUTCDay() === 1 && t.getUTCHours() === 0 && t.getUTCMinutes() === 0) {
    await rolloverWeek(env);
  }
}

export async function rolloverWeek(
  env: Env,
): Promise<{ archived: number; previousWeek: string; newWeek: string }> {
  const db = asDrizzle(env.DB);
  // The week we're rolling out of is the ISO week of "yesterday" (24h ago).
  const previousWeek = isoWeekKey("UTC", new Date(Date.now() - 86_400_000));
  const newWeek = isoWeekKey("UTC");

  // Snapshot current weeklyPoints into weekly_archive
  const rows = await db
    .select()
    .from(schema.userStats)
    .orderBy(desc(schema.userStats.weeklyPoints))
    .all();

  let rank = 1;
  let archived = 0;
  for (const r of rows) {
    if (r.weekKey !== previousWeek) continue; // already archived or stale
    if (r.weeklyPoints <= 0) {
      rank++;
      continue;
    }
    await db
      .insert(schema.weeklyArchive)
      .values({
        userId: r.userId,
        weekKey: previousWeek,
        points: r.weeklyPoints,
        rank,
      })
      .onConflictDoNothing()
      .run();
    archived++;
    rank++;
  }

  // Reset everyone to the new week with zero weekly points
  await db
    .update(schema.userStats)
    .set({
      weeklyPoints: 0,
      weekKey: newWeek,
    })
    .run();

  // Force-recompute the leaderboard so the public KV reflects the reset
  _resetDebounce();
  await recomputeLeaderboard(env, { force: true });

  return { archived, previousWeek, newWeek };
}
