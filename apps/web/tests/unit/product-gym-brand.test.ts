import { describe, expect, it } from "vitest";
import { brandCopy, navLabels } from "../../src/lib/brand/product-gym";

describe("Product Gym brand copy", () => {
  it("uses Product Gym as the app brand", () => {
    expect(brandCopy.appName).toBe("Product Gym");
    expect(brandCopy.tagline).toBe("Daily reps for sharper product judgment.");
  });

  it("uses Arena as the competitive surface", () => {
    expect(navLabels.arena).toBe("Arena");
    expect(brandCopy.leaderboardName).toBe("Arena");
  });
});
