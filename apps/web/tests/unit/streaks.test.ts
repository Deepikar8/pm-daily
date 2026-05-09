import { describe, it, expect } from "vitest";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import * as schema from "../../src/lib/server/db/schema";
import { applyAttemptToStats } from "../../src/lib/server/scoring/streaks";

function setupDb() {
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

async function seedUser(db: ReturnType<typeof setupDb>, id: string) {
  await db.insert(schema.users).values({
    id, email: `${id}@x.com`, displayName: id,
    timezone: "UTC",
    createdAt: new Date(), updatedAt: new Date(),
    lastActiveAt: Date.now(),
  }).run();
}

describe("applyAttemptToStats", () => {
  it("first attempt → streak 1, best 1, points = input", async () => {
    const db = setupDb() as unknown as Parameters<typeof applyAttemptToStats>[0]["db"];
    await seedUser(db as any, "u1");
    const r = await applyAttemptToStats({ db, userId: "u1", date: "2026-05-08", points: 100, timezone: "UTC" });
    expect(r.currentStreak).toBe(1);
    expect(r.bestStreak).toBe(1);
    expect(r.totalPoints).toBe(100);
    expect(r.weeklyPoints).toBe(100);
  });

  it("consecutive day → streak +1, points accumulate", async () => {
    const db = setupDb() as unknown as Parameters<typeof applyAttemptToStats>[0]["db"];
    await seedUser(db as any, "u1");
    await applyAttemptToStats({ db, userId: "u1", date: "2026-05-07", points: 80, timezone: "UTC" });
    const r = await applyAttemptToStats({ db, userId: "u1", date: "2026-05-08", points: 100, timezone: "UTC" });
    expect(r.currentStreak).toBe(2);
    expect(r.bestStreak).toBe(2);
    expect(r.totalPoints).toBe(180);
  });

  it("missed day → streak resets to 1; bestStreak preserved", async () => {
    const db = setupDb() as unknown as Parameters<typeof applyAttemptToStats>[0]["db"];
    await seedUser(db as any, "u1");
    await applyAttemptToStats({ db, userId: "u1", date: "2026-05-05", points: 80, timezone: "UTC" });
    await applyAttemptToStats({ db, userId: "u1", date: "2026-05-06", points: 80, timezone: "UTC" });
    // Skip 5/7
    const r = await applyAttemptToStats({ db, userId: "u1", date: "2026-05-08", points: 100, timezone: "UTC" });
    expect(r.currentStreak).toBe(1);
    expect(r.bestStreak).toBe(2);
    expect(r.totalPoints).toBe(260);
  });

  it("same-day defensive re-apply → streak unchanged but points added", async () => {
    const db = setupDb() as unknown as Parameters<typeof applyAttemptToStats>[0]["db"];
    await seedUser(db as any, "u1");
    await applyAttemptToStats({ db, userId: "u1", date: "2026-05-08", points: 100, timezone: "UTC" });
    const r = await applyAttemptToStats({ db, userId: "u1", date: "2026-05-08", points: 100, timezone: "UTC" });
    expect(r.currentStreak).toBe(1);
    expect(r.totalPoints).toBe(200);
  });
});
