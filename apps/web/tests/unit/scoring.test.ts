import { describe, it, expect } from "vitest";
import { score } from "../../src/lib/server/scoring/score";

describe("score", () => {
  it("perfect quiz, 60s, no streak → 120 pts (100 + 20)", () => {
    const r = score({ correctCount: 5, seconds: 60, streak: 0 });
    expect(r.basePoints).toBe(100);
    expect(r.speedBonus).toBe(20);
    expect(r.streakMultiplier).toBe(1.0);
    expect(r.totalPoints).toBe(120);
  });
  it("perfect quiz, 120s → speed bonus 10", () => {
    const r = score({ correctCount: 5, seconds: 120, streak: 0 });
    expect(r.speedBonus).toBe(10);
    expect(r.totalPoints).toBe(110);
  });
  it("perfect quiz, 180s → speed bonus 0", () => {
    const r = score({ correctCount: 5, seconds: 180, streak: 0 });
    expect(r.speedBonus).toBe(0);
    expect(r.totalPoints).toBe(100);
  });
  it("speed floor at 60s — sub-60s same as 60s", () => {
    expect(score({ correctCount: 5, seconds: 30, streak: 0 }).speedBonus).toBe(20);
    expect(score({ correctCount: 5, seconds: 0,  streak: 0 }).speedBonus).toBe(20);
  });
  it("streak multiplier tiers", () => {
    const args = { correctCount: 5, seconds: 60 };
    expect(score({ ...args, streak: 0  }).streakMultiplier).toBe(1.0);
    expect(score({ ...args, streak: 2  }).streakMultiplier).toBe(1.0);
    expect(score({ ...args, streak: 3  }).streakMultiplier).toBe(1.10);
    expect(score({ ...args, streak: 6  }).streakMultiplier).toBe(1.10);
    expect(score({ ...args, streak: 7  }).streakMultiplier).toBe(1.20);
    expect(score({ ...args, streak: 29 }).streakMultiplier).toBe(1.20);
    expect(score({ ...args, streak: 30 }).streakMultiplier).toBe(1.30);
    expect(score({ ...args, streak: 99 }).streakMultiplier).toBe(1.30);
  });
  it("4/5 fast cannot beat 5/5 slow (correctness dominates)", () => {
    // 4/5 @ 60s: 80 + 20 = 100. 5/5 @ 180s: 100 + 0 = 100. Strict equality
    // is the worst case; any longer time on the 4/5 attempt makes 5/5 win.
    const fast4 = score({ correctCount: 4, seconds: 60, streak: 0 });
    const slow5 = score({ correctCount: 5, seconds: 180, streak: 0 });
    expect(fast4.totalPoints).toBeLessThanOrEqual(slow5.totalPoints);
  });
  it("realistic max ≈ 156 (5/5, 60s, 30+ streak)", () => {
    const r = score({ correctCount: 5, seconds: 60, streak: 30 });
    expect(r.totalPoints).toBe(156);
  });
});
