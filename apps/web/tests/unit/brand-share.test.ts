import { describe, expect, it } from "vitest";
import { resultShareText } from "../../src/lib/brand/share";

describe("result sharing copy", () => {
  it("uses Product Gym and the score", () => {
    expect(resultShareText({ correct: 4, date: "2026-05-13" })).toBe(
      "I scored 4/5 in Product Gym on 2026-05-13. Think you can beat me?",
    );
  });

  it("includes rank when present", () => {
    expect(resultShareText({ correct: 5, date: "2026-05-13", rank: 2 })).toContain(
      "ranked #2",
    );
  });
});
