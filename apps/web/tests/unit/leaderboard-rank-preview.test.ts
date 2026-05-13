import { describe, expect, it } from "vitest";
import { previewWeeklyRank } from "../../src/lib/server/leaderboard/rank-preview";

describe("previewWeeklyRank", () => {
  it("projects the rank below existing ties", () => {
    const rows = [
      { userId: "u1", displayName: "A", weeklyPoints: 100, currentStreak: 1 },
      { userId: "u2", displayName: "B", weeklyPoints: 80, currentStreak: 1 },
      { userId: "u3", displayName: "C", weeklyPoints: 80, currentStreak: 1 },
      { userId: "u4", displayName: "D", weeklyPoints: 60, currentStreak: 1 },
    ];

    expect(previewWeeklyRank(rows, 80)).toBe(4);
  });

  it("returns null when the preview score misses a full top-50 board", () => {
    const rows = Array.from({ length: 50 }, (_, index) => ({
      userId: `u${index + 1}`,
      displayName: `User ${index + 1}`,
      weeklyPoints: 1000 - index,
      currentStreak: 1,
    }));

    expect(previewWeeklyRank(rows, 1)).toBeNull();
  });
});

