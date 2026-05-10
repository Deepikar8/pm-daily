import { describe, expect, it } from "vitest";
import { load } from "../../src/routes/+page.server";

describe("landing page load", () => {
  it("renders the landing page for authenticated users", async () => {
    const result = (await load({
      locals: {
        user: {
          id: "user_1",
          email: "pm@example.com",
          displayName: "PM",
          timezone: "UTC",
        },
      },
      platform: undefined,
    } as any)) as { previewQuestion: unknown; googleEnabled: boolean };

    expect(result.previewQuestion).toBeTruthy();
    expect(result.googleEnabled).toBe(false);
  });
});
