import { eq } from "drizzle-orm";
import * as schema from "../db/schema";
import { isoWeekKey, daysBetween } from "../timezone/helpers";
import type { DB } from "../db/client";

/**
 * Apply a freshly-finalized quiz attempt to the user_stats row.
 * Spec §6.2: streak day boundaries use the user's local timezone; weekly
 * resets use UTC (spec §6.3). The `date` argument is the user's local
 * date string (YYYY-MM-DD) — the caller is responsible for computing it.
 *
 * Idempotent on same-day re-application (defensive): if lastAttemptDate
 * is already today, currentStreak is unchanged.
 */
export async function applyAttemptToStats(args: {
  db: DB;
  userId: string;
  date: string;            // user's local YYYY-MM-DD
  points: number;
  timezone: string;        // unused here; reserved for future
}): Promise<{ currentStreak: number; bestStreak: number; weeklyPoints: number; totalPoints: number }> {
  const { db, userId, date, points } = args;
  const week = isoWeekKey("UTC");

  const existing = await db.select().from(schema.userStats)
    .where(eq(schema.userStats.userId, userId)).get();

  let currentStreak: number;
  let bestStreak: number;
  let weeklyPoints: number;
  let totalPoints: number;
  let totalAttempts: number;

  if (!existing) {
    currentStreak = 1;
    bestStreak = 1;
    weeklyPoints = points;
    totalPoints = points;
    totalAttempts = 1;
  } else {
    if (existing.lastAttemptDate) {
      const gap = daysBetween(existing.lastAttemptDate, date);
      currentStreak = gap === 1 ? existing.currentStreak + 1
                    : gap === 0 ? existing.currentStreak
                    : 1;
    } else {
      currentStreak = 1;
    }
    bestStreak = Math.max(existing.bestStreak, currentStreak);
    weeklyPoints = (existing.weekKey === week ? existing.weeklyPoints : 0) + points;
    totalPoints = existing.totalPoints + points;
    totalAttempts = existing.totalAttempts + 1;
  }

  await db.insert(schema.userStats).values({
    userId, currentStreak, bestStreak, lastAttemptDate: date,
    totalPoints, weeklyPoints, weekKey: week, totalAttempts,
  }).onConflictDoUpdate({
    target: schema.userStats.userId,
    set: { currentStreak, bestStreak, lastAttemptDate: date,
           totalPoints, weeklyPoints, weekKey: week, totalAttempts },
  }).run();

  return { currentStreak, bestStreak, weeklyPoints, totalPoints };
}
