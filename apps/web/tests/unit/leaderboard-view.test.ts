import { describe, expect, it } from "vitest";
import { getLeaderboardDisplay } from "../../src/lib/leaderboard/view";

const rows = [
  { userId: "u1", displayName: "A", weeklyPoints: 88, totalPoints: 88, currentStreak: 1 },
  { userId: "u2", displayName: "B", weeklyPoints: 68, totalPoints: 68, currentStreak: 1 },
  { userId: "u3", displayName: "C", weeklyPoints: 42, totalPoints: 42, currentStreak: 1 },
  { userId: "u4", displayName: "D", weeklyPoints: 12, totalPoints: 12, currentStreak: 1 },
];

describe("getLeaderboardDisplay", () => {
  it("renders weekly rows when there are fewer than three leaders", () => {
    const display = getLeaderboardDisplay({
      rows: rows.slice(0, 2),
      scope: "weekly",
      currentUserId: null,
    });

    expect(display.podium).toEqual([]);
    expect(display.rows.map((row) => row.userId)).toEqual(["u1", "u2"]);
  });

  it("uses podium plus rows after rank three for larger weekly boards", () => {
    const display = getLeaderboardDisplay({
      rows,
      scope: "weekly",
      currentUserId: null,
    });

    expect(display.podium.map((row) => row.userId)).toEqual(["u2", "u1", "u3"]);
    expect(display.rows.map((row) => row.userId)).toEqual(["u4"]);
  });

  it("does not duplicate the pinned current user in the rendered rows", () => {
    const display = getLeaderboardDisplay({
      rows,
      scope: "weekly",
      currentUserId: "u4",
    });

    expect(display.pinned?.userId).toBe("u4");
    expect(display.rows.map((row) => row.userId)).not.toContain("u4");
  });

  it("does not pin the user separately when they are already on the podium", () => {
    // u1 is rank 1 — would otherwise appear in the podium AND in a
    // pinned strip below it. The podium card alone is signal enough.
    const display = getLeaderboardDisplay({
      rows,
      scope: "weekly",
      currentUserId: "u1",
    });

    expect(display.podium.map((row) => row.userId)).toContain("u1");
    expect(display.pinned).toBeNull();
    // pinnedRank is still surfaced — useful if the page wants to show
    // a "you · #1" badge inside the podium tile.
    expect(display.pinnedRank).toBe(1);
  });

  it("all-time scope renders flat (no podium, no pinned strip)", () => {
    const display = getLeaderboardDisplay({
      rows,
      scope: "allTime",
      currentUserId: "u1",
    });

    expect(display.podium).toEqual([]);
    expect(display.pinned).toBeNull();
    expect(display.rows.map((row) => row.userId)).toEqual(["u1", "u2", "u3", "u4"]);
    expect(display.rowRankOffset).toBe(1);
  });
});
