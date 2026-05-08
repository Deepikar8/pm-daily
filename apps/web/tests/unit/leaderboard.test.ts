import { describe, it, expect } from "vitest";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import * as schema from "../../src/lib/server/db/schema";
import { recomputeLeaderboard, _resetDebounce } from "../../src/lib/server/leaderboard/recompute";
import * as kvKeys from "../../src/lib/server/kv/keys";
import { isoWeekKey } from "../../src/lib/server/timezone/helpers";

class FakeKV {
  store = new Map<string, string>();
  async put(k: string, v: string) { this.store.set(k, v); }
  async get(k: string) { return this.store.get(k) ?? null; }
}

function setup() {
  const sqlite = new Database(":memory:");
  const dir = "./src/lib/server/db/migrations";
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".sql")).sort()) {
    const sql = readFileSync(join(dir, f), "utf-8");
    for (const stmt of sql.split(/--> statement-breakpoint/g)) {
      const t = stmt.trim();
      if (t) sqlite.exec(t);
    }
  }
  return drizzle(sqlite, { schema });
}

async function seedUserStats(
  db: ReturnType<typeof setup>,
  users: { id: string; displayName: string; weekly: number; total: number; streak: number; deleted?: boolean }[],
) {
  const week = isoWeekKey("UTC");
  for (const u of users) {
    await db.insert(schema.users).values({
      id: u.id, email: `${u.id}@x.com`, displayName: u.displayName,
      timezone: "UTC", createdAt: Date.now(), lastActiveAt: Date.now(),
      deletedAt: u.deleted ? Date.now() : null,
    }).run();
    await db.insert(schema.userStats).values({
      userId: u.id, currentStreak: u.streak, bestStreak: u.streak,
      lastAttemptDate: "2026-05-08",
      totalPoints: u.total, weeklyPoints: u.weekly, weekKey: week,
      totalAttempts: 5,
    }).run();
  }
}

describe("recomputeLeaderboard", () => {
  it("orders weekly by weeklyPoints desc and writes KV", async () => {
    _resetDebounce();
    const db = setup();
    const kv = new FakeKV();
    await seedUserStats(db, [
      { id: "u1", displayName: "A", weekly: 100, total: 500, streak: 5 },
      { id: "u2", displayName: "B", weekly: 300, total: 700, streak: 10 },
      { id: "u3", displayName: "C", weekly: 200, total: 600, streak: 7 },
    ]);
    await recomputeLeaderboard({ DB: db as any, KV: kv } as any, { force: true });
    const week = isoWeekKey("UTC");
    const weeklyJson = JSON.parse(kv.store.get(kvKeys.leaderboardWeekly(week))!);
    expect(weeklyJson.rows.map((r: any) => r.userId)).toEqual(["u2", "u3", "u1"]);
    const allTimeJson = JSON.parse(kv.store.get(kvKeys.leaderboardAllTime())!);
    expect(allTimeJson.rows.map((r: any) => r.userId)).toEqual(["u2", "u3", "u1"]);
  });

  it("excludes deleted users", async () => {
    _resetDebounce();
    const db = setup();
    const kv = new FakeKV();
    await seedUserStats(db, [
      { id: "u1", displayName: "Active", weekly: 100, total: 500, streak: 5 },
      { id: "u2", displayName: "Deleted", weekly: 999, total: 999, streak: 99, deleted: true },
    ]);
    await recomputeLeaderboard({ DB: db as any, KV: kv } as any, { force: true });
    const weeklyJson = JSON.parse(kv.store.get(kvKeys.leaderboardWeekly(isoWeekKey("UTC")))!);
    expect(weeklyJson.rows.map((r: any) => r.userId)).toEqual(["u1"]);
  });

  it("debounces back-to-back calls (no force)", async () => {
    _resetDebounce();
    const db = setup();
    const kv = new FakeKV();
    await seedUserStats(db, [{ id: "u1", displayName: "A", weekly: 100, total: 500, streak: 5 }]);
    await recomputeLeaderboard({ DB: db as any, KV: kv } as any, { force: true });
    const after1 = kv.store.get(kvKeys.leaderboardWeekly(isoWeekKey("UTC")))!;
    // Add another user
    await db.insert(schema.users).values({
      id: "u2", email: "u2@x.com", displayName: "B", timezone: "UTC",
      createdAt: Date.now(), lastActiveAt: Date.now(),
    }).run();
    await db.insert(schema.userStats).values({
      userId: "u2", currentStreak: 1, bestStreak: 1, lastAttemptDate: "2026-05-08",
      totalPoints: 9999, weeklyPoints: 9999, weekKey: isoWeekKey("UTC"), totalAttempts: 1,
    }).run();
    // Without force, second call returns early
    await recomputeLeaderboard({ DB: db as any, KV: kv } as any);
    const after2 = kv.store.get(kvKeys.leaderboardWeekly(isoWeekKey("UTC")))!;
    expect(after2).toBe(after1);   // unchanged due to debounce
  });
});
