import { describe, expect, it } from "vitest";
import { renderShareCardSvg } from "../../src/lib/server/share/share-card";
import type { PublicShareResult } from "../../src/lib/server/share/public-result";

const result: PublicShareResult = {
  date: "2026-05-19",
  url: "/share/attempt_1",
  absoluteUrl: "https://daily.deepikamurthy.com/share/attempt_1",
  imageUrl: "https://daily.deepikamurthy.com/share/attempt_1/card.svg",
  player: {
    displayName: "Deepika",
    role: "Founder",
  },
  result: {
    totalCorrect: 4,
    totalSeconds: 95,
    totalPoints: 920,
    rank: 3,
  },
  session: {
    headline: "Introducing the GAIN Framework for feedback",
    sourceTitle: "Introducing the GAIN Framework",
    sourceByline: "Jack Cohen",
    sourceType: "newsletter",
  },
  questions: [],
};

describe("dynamic share card", () => {
  it("renders app-styled SVG with operator, lesson, score, points, and rank", () => {
    const svg = renderShareCardSvg(result);

    expect(svg).toContain("<svg");
    expect(svg).toContain("Product Gym");
    expect(svg).toContain("Deepika practiced today&apos;s PM rep");
    expect(svg).toContain("Introducing the GAIN Framework for feedback");
    expect(svg).toContain("From Jack Cohen via Lenny&apos;s Newsletter");
    expect(svg).toContain("4/5");
    expect(svg).toContain("920 pts");
    expect(svg).toContain("#3 this week");
  });

  it("omits takeaway when the user did not share one", () => {
    expect(renderShareCardSvg(result)).not.toContain("My takeaway");
  });

  it("includes takeaway when provided", () => {
    expect(renderShareCardSvg({ ...result, takeaway: "Open with the shared goal." })).toContain(
      "My takeaway: Open with the shared goal.",
    );
  });
});
