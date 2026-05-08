import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { DailyContent } from "../../src/lib/server/content/types";

describe("mock content fixture", () => {
  it("validates 2026-05-08 against DailyContent schema", () => {
    const json = JSON.parse(readFileSync("./content/2026-05-08.json", "utf-8"));
    const result = DailyContent.safeParse(json);
    if (!result.success) console.error(result.error);
    expect(result.success).toBe(true);
  });
});
