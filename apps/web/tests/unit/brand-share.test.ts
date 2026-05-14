import { describe, expect, it } from "vitest";
import { formatShareDate, resultShareHeadline, resultShareText } from "../../src/lib/brand/share";

describe("result sharing copy", () => {
  it("frames sharing as practice first and includes the score", () => {
    expect(resultShareHeadline({ correct: 4, date: "2026-05-13" })).toBe(
      "I practiced today’s Product Gym rep on 13th May and scored 4/5.",
    );
  });

  it("includes rank when present", () => {
    expect(resultShareHeadline({ correct: 5, date: "2026-05-13", rank: 2 })).toContain(
      "preview rank #2",
    );
  });

  it("explains what Product Gym is", () => {
    expect(resultShareText({ correct: 5, date: "2026-05-13" })).toContain(
      "turns long-form operator ideas from Lenny’s Podcast and Newsletter into applied product decisions",
    );
  });

  it("formats dates with ordinal suffixes", () => {
    expect(formatShareDate("2026-05-01")).toBe("1st May");
    expect(formatShareDate("2026-05-02")).toBe("2nd May");
    expect(formatShareDate("2026-05-03")).toBe("3rd May");
    expect(formatShareDate("2026-05-11")).toBe("11th May");
    expect(formatShareDate("2026-05-13")).toBe("13th May");
  });
});
