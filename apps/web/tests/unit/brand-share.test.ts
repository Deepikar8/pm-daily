import { describe, expect, it } from "vitest";
import { formatShareDate, resultShareHeadline, resultShareText } from "../../src/lib/brand/share";

describe("result sharing copy", () => {
  it("uses Product Gym and the score in the headline", () => {
    expect(resultShareHeadline({ correct: 4, date: "2026-05-13" })).toBe(
      "I scored 4/5 in Product Gym on 13th May. Think you can beat me?",
    );
  });

  it("includes rank when present", () => {
    expect(resultShareHeadline({ correct: 5, date: "2026-05-13", rank: 2 })).toContain(
      "ranked #2",
    );
  });

  it("explains what Product Gym is", () => {
    expect(resultShareText({ correct: 5, date: "2026-05-13" })).toContain(
      "one daily product judgment challenge",
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
