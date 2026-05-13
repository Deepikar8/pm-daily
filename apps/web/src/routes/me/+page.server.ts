import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { getDb } from "$lib/server/db/client";
import { users, userStats, quizAttempts, dailySessions } from "$lib/server/db/schema";
import { and, desc, eq, gte } from "drizzle-orm";
import { localDate, daysBetween } from "$lib/server/timezone/helpers";
import { readLeaderboards } from "$lib/server/leaderboard/read";

export const load: PageServerLoad = async ({ locals, platform }) => {
  if (!locals.user) throw redirect(302, "/");
  if (!platform?.env) throw redirect(302, "/");
  const env = platform.env;
  const db = getDb(env.DB);
  const tz = locals.user.timezone ?? "UTC";

  const userRow = await db.select().from(users).where(eq(users.id, locals.user.id)).get();
  if (!userRow) throw redirect(302, "/");
  if (!userRow.termsAcceptedAt) throw redirect(302, "/onboarding");

  const stats = await db.select().from(userStats)
    .where(eq(userStats.userId, locals.user.id)).get();

  const today = localDate(tz);
  // 14-day heatmap: build a map of date → totalCorrect (or null for missed)
  const since = new Date(Date.now() - 13 * 86_400_000).toISOString().slice(0, 10);
  const recentAttempts = await db.select({
    date: quizAttempts.date,
    totalCorrect: quizAttempts.totalCorrect,
    totalPoints: quizAttempts.totalPoints,
    totalSeconds: quizAttempts.totalSeconds,
    headline: dailySessions.headline,
    sourceJson: dailySessions.sourceJson,
  }).from(quizAttempts)
    .leftJoin(dailySessions, eq(dailySessions.date, quizAttempts.date))
    .where(and(eq(quizAttempts.userId, locals.user.id), gte(quizAttempts.date, since)))
    .orderBy(desc(quizAttempts.date))
    .all();

  const byDate = new Map(recentAttempts.map((a) => [a.date, a]));
  const availableSessions = await db.select({
    date: dailySessions.date,
  }).from(dailySessions)
    .where(gte(dailySessions.date, since))
    .all();
  const availableDates = new Set(availableSessions.map((s) => s.date));
  const heatmap: { date: string; score: number | null; href: string; available: boolean }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    const a = byDate.get(d);
    heatmap.push({
      date: d,
      score: a?.totalCorrect ?? null,
      href: a ? `/quiz/${d}/done` : `/quiz/${d}`,
      available: availableDates.has(d),
    });
  }

  // Last 5 attempts overall (not just last 14d)
  const recent = await db.select({
    id: quizAttempts.id,
    date: quizAttempts.date,
    totalCorrect: quizAttempts.totalCorrect,
    totalPoints: quizAttempts.totalPoints,
    totalSeconds: quizAttempts.totalSeconds,
    headline: dailySessions.headline,
    sourceJson: dailySessions.sourceJson,
  }).from(quizAttempts)
    .leftJoin(dailySessions, eq(dailySessions.date, quizAttempts.date))
    .where(eq(quizAttempts.userId, locals.user.id))
    .orderBy(desc(quizAttempts.date))
    .limit(5)
    .all();

  // Leaderboard: my weekly rank
  const lb = await readLeaderboards(env);
  const myRank = lb.weekly.rows.findIndex((r: any) => r.userId === locals.user!.id);

  const joined = userRow.createdAt
    ? new Date(userRow.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "";

  return {
    user: {
      id: userRow.id,
      displayName: userRow.displayName,
      role: userRow.role ?? "Product Manager",
      timezone: userRow.timezone,
      joined,
    },
    stats: {
      currentStreak: stats?.currentStreak ?? 0,
      bestStreak: stats?.bestStreak ?? 0,
      totalPoints: stats?.totalPoints ?? 0,
      weeklyPoints: stats?.weeklyPoints ?? 0,
      totalAttempts: stats?.totalAttempts ?? 0,
      weeklyRank: myRank >= 0 ? myRank + 1 : null,
    },
    heatmap,
    recent: recent.map((r) => ({
      id: r.id,
      date: r.date,
      totalCorrect: r.totalCorrect ?? 0,
      totalPoints: r.totalPoints ?? 0,
      totalSeconds: r.totalSeconds ?? 0,
      headline: r.headline ?? "",
      byline: r.sourceJson ? (JSON.parse(r.sourceJson).byline ?? "") : "",
    })),
    shareResult: recent[0]
      ? {
          url: `/share/${recent[0].id}`,
          date: recent[0].date,
          totalCorrect: recent[0].totalCorrect ?? 0,
          rank: myRank >= 0 ? myRank + 1 : null,
        }
      : null,
  };
};
