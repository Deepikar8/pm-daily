import { describe, it, expect } from "vitest";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { users } from "../../src/lib/server/db/schema";

describe("D1 schema", () => {
  it("applies migrations and supports a basic insert", () => {
    const sqlite = new Database(":memory:");
    const migrationsDir = "./src/lib/server/db/migrations";
    for (const file of readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort()) {
      const sql = readFileSync(join(migrationsDir, file), "utf-8");
      // drizzle-kit emits statement-breakpoints; split & run each
      for (const stmt of sql.split(/--> statement-breakpoint/g)) {
        const trimmed = stmt.trim();
        if (trimmed) sqlite.exec(trimmed);
      }
    }
    const db = drizzle(sqlite);
    db.insert(users).values({
      id: "01HXYZ", email: "a@b.com", displayName: "Test",
      timezone: "America/Los_Angeles",
      createdAt: Date.now(), lastActiveAt: Date.now(),
    }).run();
    const rows = db.select().from(users).all();
    expect(rows).toHaveLength(1);
    expect(rows[0].email).toBe("a@b.com");
  });
});
