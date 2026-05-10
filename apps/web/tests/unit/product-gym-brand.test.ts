import { describe, expect, it } from "vitest";
import { brandCopy, navLabels } from "../../src/lib/brand/product-gym";

describe("Product Gym brand copy", () => {
  it("uses Product Gym as the app brand", () => {
    expect(brandCopy.appName).toBe("Product Gym");
    expect(brandCopy.tagline).toBe("One daily challenge to sharpen your product instincts.");
  });

  it("uses Arena as the competitive surface", () => {
    expect(navLabels.arena).toBe("Leaderboard");
    expect(brandCopy.leaderboardName).toBe("Arena");
  });
});
