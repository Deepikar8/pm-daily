import { describe, it, expect } from "vitest";
import * as kv from "../../src/lib/server/kv/keys";

describe("KV keys", () => {
  it("today digest", () => expect(kv.todayDigest("2026-05-08")).toBe("today:digest:2026-05-08"));
  it("today questions", () => expect(kv.todayQuestions("2026-05-08")).toBe("today:questions:2026-05-08"));
  it("weekly leaderboard with ISO week", () => expect(kv.leaderboardWeekly("2026-W19")).toBe("leaderboard:weekly:2026-W19"));
  it("alltime leaderboard", () => expect(kv.leaderboardAllTime()).toBe("leaderboard:alltime"));
  it("user stats", () => expect(kv.userStats("01HXYZ")).toBe("user:stats:01HXYZ"));
});
