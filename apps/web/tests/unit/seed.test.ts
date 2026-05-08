import { describe, it, expect } from "vitest";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { seedDay } from "../../src/lib/server/content/seed";
import * as schema from "../../src/lib/server/db/schema";

class FakeKV {
  store = new Map<string, string>();
  async put(k: string, v: string) { this.store.set(k, v); }
  async get(k: string) { return this.store.get(k) ?? null; }
}

function applyMigrations(sqlite: Database.Database) {
  const dir = "./src/lib/server/db/migrations";
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".sql")).sort()) {
    const sql = readFileSync(join(dir, f), "utf-8");
    for (const stmt of sql.split(/--> statement-breakpoint/g)) {
      const trimmed = stmt.trim();
      if (trimmed) sqlite.exec(trimmed);
    }
  }
}

describe("seedDay", () => {
  it("writes session + 5 questions to D1 and warms KV; correct keys never cached", async () => {
    const sqlite = new Database(":memory:");
    applyMigrations(sqlite);
    const db = drizzle(sqlite, { schema }) as unknown as Parameters<typeof seedDay>[0]["db"];
    const kv = new FakeKV();
    const json = JSON.parse(readFileSync("./content/2026-05-08.json", "utf-8"));
    const result = await seedDay({ db, kv, contentJson: json });

    expect(result.date).toBe("2026-05-08");
    expect(result.questionIds).toHaveLength(5);

    expect(kv.store.has("today:digest:2026-05-08")).toBe(true);
    const cached = JSON.parse(kv.store.get("today:questions:2026-05-08")!);
    expect(cached).toHaveLength(5);

    // Critical: correct_key, explanation, pm_takeaway must NOT appear in KV
    expect(cached[0]).not.toHaveProperty("correct_key");
    expect(cached[0]).not.toHaveProperty("explanation_md");
    expect(cached[0]).not.toHaveProperty("pm_takeaway");
    // Citation quote_excerpt also stripped at this layer
    expect(cached[0].citation).not.toHaveProperty("quote_excerpt");
  });
});
