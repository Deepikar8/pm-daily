import { describe, it, expect } from "vitest";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import * as schema from "../../src/lib/server/db/schema";
import { rolloverWeek } from "../../src/lib/server/cron";
import { isoWeekKey } from "../../src/lib/server/timezone/helpers";

class FakeKV {
  store = new Map<string, string>();
  async put(k: string, v: string) {
    this.store.set(k, v);
  }
  async get(k: string) {
    return this.store.get(k) ?? null;
  }
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

async function seed(
  db: any,
  users: { id: string; weeklyPoints: number; weekKey: string }[],
) {
  for (const u of users) {
    await db
      .insert(schema.users)
      .values({
        id: u.id,
        email: `${u.id}@x.com`,
        displayName: u.id,
        timezone: "UTC",
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
      })
      .run();
    await db
      .insert(schema.userStats)
      .values({
        userId: u.id,
        currentStreak: 1,
        bestStreak: 1,
        lastAttemptDate: "2026-05-08",
        totalPoints: u.weeklyPoints,
        weeklyPoints: u.weeklyPoints,
        weekKey: u.weekKey,
        totalAttempts: 1,
      })
      .run();
  }
}

describe("rolloverWeek", () => {
  it("archives non-zero stats from the previous week, ranks by weeklyPoints, resets to new week with 0", async () => {
    const db = setup();
    const kv = new FakeKV();
    const previousWeek = isoWeekKey("UTC", new Date(Date.now() - 86_400_000));
    const newWeek = isoWeekKey("UTC");

    await seed(db as any, [
      { id: "u1", weeklyPoints: 100, weekKey: previousWeek },
      { id: "u2", weeklyPoints: 300, weekKey: previousWeek },
      { id: "u3", weeklyPoints: 200, weekKey: previousWeek },
      { id: "u4", weeklyPoints: 0, weekKey: previousWeek }, // skipped (zero)
    ]);

    const r = await rolloverWeek({ DB: db as any, KV: kv } as any);
    expect(r.archived).toBe(3);
    expect(r.previousWeek).toBe(previousWeek);

    const archive = await db.select().from(schema.weeklyArchive).all();
    expect(archive).toHaveLength(3);
    const sorted = [...archive].sort((a, b) => a.rank - b.rank);
    expect(sorted.map((a) => a.userId)).toEqual(["u2", "u3", "u1"]);
    expect(sorted[0].points).toBe(300);

    const stats = await db.select().from(schema.userStats).all();
    for (const s of stats) {
      expect(s.weeklyPoints).toBe(0);
      expect(s.weekKey).toBe(newWeek);
    }
  });

  it("idempotent on re-run (onConflictDoNothing)", async () => {
    const db = setup();
    const kv = new FakeKV();
    const previousWeek = isoWeekKey("UTC", new Date(Date.now() - 86_400_000));
    await seed(db as any, [{ id: "u1", weeklyPoints: 100, weekKey: previousWeek }]);
    await rolloverWeek({ DB: db as any, KV: kv } as any);
    // After first run, all weekKeys are flipped to newWeek; second run finds no rows in previousWeek and archives 0
    const r2 = await rolloverWeek({ DB: db as any, KV: kv } as any);
    expect(r2.archived).toBe(0);
    const archive = await db.select().from(schema.weeklyArchive).all();
    expect(archive).toHaveLength(1); // still 1 — no duplicate
  });

  it("uses provided scheduledTime, not wall clock", async () => {
    const db = setup();
    const kv = new FakeKV();
    // Pretend the cron fires at Monday May 11 2026 00:00:00 UTC, late
    const scheduledTime = Date.UTC(2026, 4, 11, 0, 0, 0); // Mon May 11
    const previousWeek = "2026-W19"; // ISO week containing May 4-10 2026
    const newWeek = "2026-W20"; // ISO week containing May 11-17 2026
    await seed(db as any, [
      { id: "u1", weeklyPoints: 100, weekKey: previousWeek },
      { id: "u2", weeklyPoints: 200, weekKey: previousWeek },
    ]);
    const r = await rolloverWeek(
      { DB: db as any, KV: kv } as any,
      scheduledTime,
    );
    expect(r.previousWeek).toBe(previousWeek);
    expect(r.newWeek).toBe(newWeek);
  });

  it("does NOT wipe rows that already advanced to newWeek (race protection)", async () => {
    const db = setup();
    const kv = new FakeKV();
    const scheduledTime = Date.UTC(2026, 4, 11, 0, 0, 0);
    const previousWeek = "2026-W19";
    const newWeek = "2026-W20";
    await seed(db as any, [
      { id: "uOld", weeklyPoints: 100, weekKey: previousWeek }, // gets reset
      { id: "uRaceWinner", weeklyPoints: 25, weekKey: newWeek }, // already on new week — DO NOT TOUCH
    ]);
    await rolloverWeek({ DB: db as any, KV: kv } as any, scheduledTime);

    const stats = await db.select().from(schema.userStats).all();
    const old = stats.find((s) => s.userId === "uOld")!;
    const race = stats.find((s) => s.userId === "uRaceWinner")!;
    expect(old.weeklyPoints).toBe(0);
    expect(old.weekKey).toBe(newWeek);
    // Critical: race winner's NEW points must survive
    expect(race.weeklyPoints).toBe(25);
    expect(race.weekKey).toBe(newWeek);
  });
});
