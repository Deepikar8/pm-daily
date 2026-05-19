import { describe, expect, it } from "vitest";
import {
  formatShareDate,
  normalizeShareTakeaway,
  resultShareHeadline,
  resultShareText,
} from "../../src/lib/brand/share";

describe("result sharing copy", () => {
  it("frames sharing as practice first and includes the score", () => {
    expect(resultShareHeadline({ correct: 4, date: "2026-05-13" })).toBe(
      "I practiced today’s Product Gym rep on 13th May and scored 4/5.",
    );
  });

  it("includes rank when present", () => {
    expect(resultShareHeadline({ correct: 5, date: "2026-05-13", rank: 2 })).toContain(
      "#2 this week",
    );
  });

  it("includes lesson and operator when available", () => {
    const copy = resultShareText({
      correct: 4,
      date: "2026-05-19",
      lessonTitle: "Introducing the GAIN Framework for feedback",
      operatorName: "Jack Cohen",
      sourceLabel: "Lenny's Newsletter",
    });

    expect(copy).toContain("Today’s lesson: Introducing the GAIN Framework for feedback");
    expect(copy).toContain("Operator: Jack Cohen via Lenny's Newsletter");
  });

  it("omits takeaway text when no takeaway is shared", () => {
    expect(resultShareText({ correct: 4, date: "2026-05-19" })).not.toContain("My takeaway");
  });

  it("includes takeaway only when the user shares one", () => {
    expect(
      resultShareText({ correct: 4, date: "2026-05-19", takeaway: "Anchor feedback in a shared goal." }),
    ).toContain("My takeaway: Anchor feedback in a shared goal.");
  });

  it("normalizes shared takeaway text for URLs and cards", () => {
    expect(normalizeShareTakeaway("  Anchor\nfeedback\tin a shared goal.  ")).toBe(
      "Anchor feedback in a shared goal.",
    );
    expect(normalizeShareTakeaway("x".repeat(200))).toHaveLength(160);
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
