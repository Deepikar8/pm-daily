import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const launchStart = "2026-05-13";
const launchDays = 14;

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

describe("launch content runway", () => {
  it("has 14 consecutive go-live days starting May 13", () => {
    const files = new Set(
      readdirSync("content").filter((file) => /^\d{4}-\d{2}-\d{2}\.json$/.test(file)),
    );

    for (let i = 0; i < launchDays; i += 1) {
      expect(files.has(`${addDays(launchStart, i)}.json`)).toBe(true);
    }
  });

  it("each launch day has exactly five valid questions", () => {
    for (let i = 0; i < launchDays; i += 1) {
      const date = addDays(launchStart, i);
      const content = JSON.parse(readFileSync(join("content", `${date}.json`), "utf8"));

      expect(content.date).toBe(date);
      expect(content.questions).toHaveLength(5);
      expect(content.questions.map((q: { position: number }) => q.position)).toEqual([1, 2, 3, 4, 5]);

      for (const q of content.questions) {
        expect(["A", "B", "C", "D"]).toContain(q.correct_key);
        expect(q.options.map((o: { key: string }) => o.key).sort()).toEqual(["A", "B", "C", "D"]);
        expect(q.scenario_md.length).toBeGreaterThan(40);
        expect(q.explanation_md.length).toBeGreaterThan(40);
        expect(q.pm_takeaway.length).toBeGreaterThan(20);
        expect(q.citation.quote_excerpt.length).toBeGreaterThan(20);
      }
    }
  });

  it("does not use unsupported lennyspodcast query URLs", () => {
    const files = readdirSync("content").filter((file) => /^\d{4}-\d{2}-\d{2}\.json$/.test(file));

    for (const file of files) {
      const raw = readFileSync(join("content", file), "utf8");
      expect(raw).not.toContain("https://www.lennyspodcast.com/?q=");
    }
  });
});
